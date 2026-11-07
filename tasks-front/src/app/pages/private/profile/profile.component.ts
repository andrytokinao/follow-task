import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MemberGroupe, User } from '../../../type/issue';
import { UserService } from '../../../services/user.service';
import { supprimerTypename } from '../../../type/graphql.operations';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { WhatsAppLinkState } from '../../../type/whatsapp-link';
import { ContactsService, LinkCodeResponse } from '../../../services/contacts.service';

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const nw = form.get('newPassword')?.value;
  const cf = form.get('confirmPassword')?.value;
  return nw && cf && nw !== cf ? { mismatch: true } : null;
}

export type ContactType = 'WHATSAPP' | 'EMAIL';

export interface Contact {
  id: string;
  typeContact: ContactType;
  value: string;
  label: string | null;
  isVerified: boolean;
}

interface ContactSuggestion {
  value: string;
  label: string;
  typeContact: ContactType;
}

type AddContactStep = 'search' | 'verify' | 'success';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private contactService: ContactsService
  ) {}

  @ViewChild('photoInput') photoInputRef!: ElementRef<HTMLInputElement>;

  savingStatus: string = '';
  tempPhoto: string | null = null;
  user: User | any = {};
  // Renseigné par l'appelant quand le composant est ouvert en modale
  // (modalService.open). Reste undefined sur la route /working/profile.
  activeModal: any;
  action: string = '';
  memberGroupes: MemberGroupe[] = [];
  selectedPhoto: File | null = null;
  isCreate: boolean = false;

  hideInitPw = true;
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  userForm!: FormGroup;
  passwordForm!: FormGroup;

  // Statut dédié au changement de mot de passe, séparé de `savingStatus`
  // (utilisé par le formulaire utilisateur) pour ne pas mélanger les deux
  // messages si l'utilisateur bascule entre les onglets.
  passwordChangeStatus: string = '';
  private passwordStatusTimer: ReturnType<typeof setTimeout> | null = null;

  // ---------------------------------------------------------------------
  // Contacts (données fictives pour l'affichage)
  // ---------------------------------------------------------------------

  contacts: Contact[] = [
    { id: 'c1', typeContact: 'WHATSAPP', value: '+261 34 12 345 67', label: 'Numéro principal', isVerified: true },
    { id: 'c2', typeContact: 'EMAIL', value: 'rakoto.jean@example.com', label: 'Email professionnel', isVerified: true },
    { id: 'c3', typeContact: 'WHATSAPP', value: '+261 32 98 765 43', label: null, isVerified: false },
  ];

  // Base fictive utilisée pour simuler l'autocomplétion
  private fakeDirectory: ContactSuggestion[] = [
    { value: '+261 34 00 111 22', label: 'Andriamampianina Sarah', typeContact: 'WHATSAPP' },
    { value: '+261 33 55 222 89', label: 'Randria Tojo', typeContact: 'WHATSAPP' },
    { value: '+261 32 44 777 10', label: 'Rasoanaivo Miora', typeContact: 'WHATSAPP' },
    { value: 'sarah.andria@example.com', label: 'Andriamampianina Sarah', typeContact: 'EMAIL' },
    { value: 'tojo.randria@example.com', label: 'Randria Tojo', typeContact: 'EMAIL' },
    { value: 'miora.rasoa@example.com', label: 'Rasoanaivo Miora', typeContact: 'EMAIL' },
  ];

  showAddContact = false;
  addContactStep: AddContactStep = 'search';

  addContactType: ContactType = 'WHATSAPP';
  addContactValue = '';
  addContactLabel = '';
  suggestions: ContactSuggestion[] = [];
  showSuggestions = false;

  addContactCode = '';
  addContactSubmitting = false;
  addContactError: string | null = null;
  resendCooldown = 0;
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.userForm = this.fb.group({
      username:  [this.user.username,  Validators.required],
      email:     [this.user.email,     [Validators.required, Validators.email]],
      firstName: [this.user.firstName],
      lastName:  [this.user.lastName],
      contact:   [this.user.contact],
      cin:       [this.user.cin],
      address:   [this.user.address],
      password:  [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: [''],
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordMatchValidator });

    this.loadWhatsAppLink();
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    if (this.passwordStatusTimer) clearTimeout(this.passwordStatusTimer);
    this.stopWhatsAppWatch();
    this.stopCodeCountdown();
  }

  // -----------------------------------------------------------------
  // Rattachement WhatsApp
  // -----------------------------------------------------------------

  whatsAppLink: WhatsAppLinkState | null = null;
  whatsAppBusy = false;
  whatsAppError: string | null = null;
  /** Le code vient d'être copié : retour visuel bref. */
  whatsAppCodeCopied = false;
  /** Une vérification automatique est en cours pendant que l'utilisateur écrit. */
  whatsAppWatching = false;
  private whatsAppWatchTimer: ReturnType<typeof setInterval> | null = null;
  /** Nombre de vérifications automatiques restantes. */
  private whatsAppWatchLeft = 0;

  /** Code de liaison renvoyé par le serveur (null = aucun code en cours). */
  linkCode: LinkCodeResponse | null = null;
  /** Secondes restantes avant l'expiration du code. */
  codeSecondsLeft = 0;
  private codeTimer: ReturnType<typeof setInterval> | null = null;

  /** Une vérification toutes les 5 s, pendant 2 min : au delà, bouton manuel. */
  private static readonly WATCH_INTERVAL_MS = 5000;
  private static readonly WATCH_MAX = 24;

  private loadWhatsAppLink(): void {
    this.userService.whatsAppLinkState().subscribe({
      next: state => this.whatsAppLink = state,
      error: err => this.whatsAppError = this.messageErreur(err)
    });
  }

  /**
   * Demande le code (ou récupère celui encore valide) que l'utilisateur
   * enverra lui-même au numéro du système.
   */
  startWhatsAppLink(): void {
    if (this.whatsAppBusy) return;
    this.whatsAppBusy = true;
    this.whatsAppError = null;
    this.contactService.generateWhatsAppLinkCode().subscribe({
      next: res => {
        this.whatsAppBusy = false;
        this.linkCode = res;
        this.startCodeCountdown(res.expiresInSeconds);
        this.startWhatsAppWatch();
      },
      error: err => {
        this.whatsAppBusy = false;
        this.whatsAppError = this.messageErreur(err);
      }
    });
  }

  /** Vérification demandée explicitement, quand l'utilisateur a envoyé son message. */
  verifyWhatsAppLink(): void {
    this.runWhatsApp(this.userService.verifyWhatsAppLink(), state => {
      if (!state.linked) {
        this.whatsAppError = "Le code n'est pas encore arrivé. Vérifiez l'envoi, puis réessayez.";
      }
    });
  }

  unlinkWhatsApp(): void {
    this.runWhatsApp(this.userService.unlinkWhatsApp());
  }

  /**
   * Enchaînement commun aux actions : un seul appel en vol, l'état rendu
   * remplace l'état courant, l'erreur est affichée telle que le serveur la
   * formule.
   */
  private runWhatsApp(appel: Observable<WhatsAppLinkState>,
                      apres?: (state: WhatsAppLinkState) => void): void {
    if (this.whatsAppBusy) return;
    this.whatsAppBusy = true;
    this.whatsAppError = null;
    appel.subscribe({
      next: state => {
        this.whatsAppBusy = false;
        this.whatsAppLink = state;
        if (state.linked) {
          this.onWhatsAppLinked();
        }
        apres?.(state);
      },
      error: err => {
        this.whatsAppBusy = false;
        this.whatsAppError = this.messageErreur(err);
      }
    });
  }

  /** Liaison terminée : on arrête surveillance et compte à rebours, le code n'a plus d'objet. */
  private onWhatsAppLinked(): void {
    this.stopWhatsAppWatch();
    this.stopCodeCountdown();
    this.linkCode = null;
    this.codeSecondsLeft = 0;
  }

  /**
   * Interroge le serveur pendant que l'utilisateur envoie son message : le
   * fournisseur WhatsApp ne pousse aucune notification, il faut aller voir.
   * La surveillance s'arrête d'elle-même pour ne pas interroger indéfiniment.
   */
  private startWhatsAppWatch(): void {
    this.stopWhatsAppWatch();
    this.whatsAppWatching = true;
    this.whatsAppWatchLeft = ProfileComponent.WATCH_MAX;
    this.whatsAppWatchTimer = setInterval(() => {
      if (this.whatsAppWatchLeft-- <= 0) {
        this.stopWhatsAppWatch();
        return;
      }
      if (this.whatsAppBusy) return;
      this.userService.verifyWhatsAppLink().subscribe({
        next: state => {
          this.whatsAppLink = state;
          if (state.linked) this.onWhatsAppLinked();
        },
        // Une panne passagère ne doit pas afficher d'erreur pendant une
        // surveillance de fond : le bouton manuel reste disponible.
        error: () => this.stopWhatsAppWatch()
      });
    }, ProfileComponent.WATCH_INTERVAL_MS);
  }

  private stopWhatsAppWatch(): void {
    if (this.whatsAppWatchTimer) clearInterval(this.whatsAppWatchTimer);
    this.whatsAppWatchTimer = null;
    this.whatsAppWatching = false;
  }

  // ----- Compte à rebours du code -----

  /**
   * Le serveur renvoie une durée restante (et non une date) : le serveur et le
   * navigateur n'ont pas le même fuseau, une date sans fuseau serait décalée.
   */
  private startCodeCountdown(seconds: number): void {
    this.stopCodeCountdown();
    const deadline = Date.now() + seconds * 1000;
    const tick = () => {
      if (this.whatsAppLink?.linked) { this.stopCodeCountdown(); return; }
      const left = Math.ceil((deadline - Date.now()) / 1000);
      if (left <= 0) { this.expireCode(); return; }
      this.codeSecondsLeft = left;
    };
    tick();
    this.codeTimer = setInterval(tick, 1000);
  }

  private stopCodeCountdown(): void {
    if (this.codeTimer) clearInterval(this.codeTimer);
    this.codeTimer = null;
  }

  private expireCode(): void {
    this.stopCodeCountdown();
    this.stopWhatsAppWatch();
    this.linkCode = null;
    this.codeSecondsLeft = 0;
    this.whatsAppError = 'Le code a expiré. Générez-en un nouveau.';
  }

  /** "+261340568013", extrait du lien wa.me renvoyé par le serveur. */
  get whatsAppServiceNumber(): string {
    const m = this.linkCode?.link?.match(/wa\.me\/(\d+)/);
    return m ? '+' + m[1] : '';
  }

  /** "4:32" */
  get codeCountdownLabel(): string {
    const m = Math.floor(this.codeSecondsLeft / 60);
    const s = this.codeSecondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /** Copie le code sans l'espace d'affichage ("483 921" devient "483921"). */
  copyWhatsAppCode(): void {
    const code = this.linkCode?.code.replace(/\s/g, '');
    if (!code || !navigator.clipboard) return;
    navigator.clipboard.writeText(code).then(() => {
      this.whatsAppCodeCopied = true;
      setTimeout(() => this.whatsAppCodeCopied = false, 2000);
    });
  }

  private messageErreur(err: any): string {
    const graphQl = err?.graphQLErrors?.length ? err.graphQLErrors[0].message : null;
    return graphQl || err?.error?.message || err?.message || "L'opération a échoué.";
  }

  // -----------------------------------------------------------------
  // Mot de passe
  // -----------------------------------------------------------------

  get passwordStrength(): number {
    const pw: string = this.passwordForm.get('newPassword')?.value || '';
    let score = 0;
    if (pw.length >= 8) score += 33;
    if (/[A-Z]/.test(pw)) score += 33;
    if (/[0-9]/.test(pw)) score += 34;
    return score;
  }

  get passwordStrengthColor(): string {
    const s = this.passwordStrength;
    if (s < 40) return 'warn';
    if (s < 80) return 'accent';
    return 'primary';
  }

  get passwordStrengthLabel(): string {
    const s = this.passwordStrength;
    if (!this.passwordForm.get('newPassword')?.value) return '';
    if (s < 40) return 'Faible';
    if (s < 80) return 'Moyen';
    return 'Fort';
  }

  // Ferme la modale. Aucun appelant n'affecte `activeModal` aujourd'hui, et
  // le composant est aussi routé (/working/profile) : sans cette garde, les
  // boutons "Fermer" et "Annuler" lèvent une erreur.
  close(): void {
    this.activeModal?.dismiss();
  }

  photoUrl(): string {
    if (this.tempPhoto) return this.tempPhoto;
    return this.user?.photo
      ? environment.apiURL + 'photo/' + this.user.photo
      : 'assets/photo.png';
  }

  loadGroupeMember() {
    this.userService.loadGroupeMember(this.user.id).subscribe(
      (res: any) => { this.memberGroupes = supprimerTypename(res.data.loadGroupeMember); },
      (err) => { console.error('loadGroupeMember', err); }
    );
  }

  saveUser() {
    // Le champ password n'est affiché qu'en création (isCreate) ; en édition
    // le FormGroup contient quand même une valeur vide qu'il ne faut pas envoyer,
    // sous peine d'écraser le mot de passe existant côté backend.
    const { password, ...formValueWithoutPassword } = this.userForm.value;
    const data = this.isCreate
      ? { ...this.user, ...this.userForm.value }
      : { ...this.user, ...formValueWithoutPassword };

    this.userService.saveUser(data).subscribe(
      () => { this.savingStatus = 'success'; },
      (err) => { this.savingStatus = 'error'; console.error(err); }
    );
  }

  changePassword() {
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.userService.changePassword(this.user.id, currentPassword, newPassword).subscribe(
      () => {
        this.resetPasswordForm();
        this.passwordChangeStatus = 'success';
        this.scheduleClearPasswordStatus();
      },
      (err) => {
        console.error(err);
        this.passwordChangeStatus = 'error';
        this.scheduleClearPasswordStatus();
      }
    );
  }

  // reset() vide les valeurs et remet chaque contrôle à pristine/untouched,
  // mais on le force explicitement control par control pour être sûr
  // qu'aucun champ ne reste marqué "touched" (donc affiché en rouge par
  // Material) après le changement de mot de passe.
  private resetPasswordForm(): void {
    this.passwordForm.reset();
    Object.values(this.passwordForm.controls).forEach(control => {
      control.markAsUntouched();
      control.markAsPristine();
    });
    this.passwordForm.markAsUntouched();
    this.passwordForm.markAsPristine();
  }

  private scheduleClearPasswordStatus(): void {
    if (this.passwordStatusTimer) clearTimeout(this.passwordStatusTimer);
    this.passwordStatusTimer = setTimeout(() => (this.passwordChangeStatus = ''), 4000);
  }

  selectPhoto($event: Event) {
    const input = $event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) { this.selectedPhoto = file; this.previewImage(file); }
  }

  previewImage(file: File) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => { this.tempPhoto = reader.result as string; };
  }

  openPhotoInput() {
    this.photoInputRef.nativeElement.click();
  }

  uploadPhoto() {
    if (!this.selectedPhoto) return;
    this.userService.upload(this.selectedPhoto, this.user.id).subscribe();
  }

  loadUser(userId: string) {
    this.userService.getUser(userId).subscribe((user: User) => {
      this.user = user;
      this.userForm?.patchValue(user);
    });
  }

  // ---------------------------------------------------------------------
  // Gestion des contacts (flux d'ajout avec données fictives)
  // ---------------------------------------------------------------------

  removeContact(contact: Contact): void {
    this.contacts = this.contacts.filter(c => c.id !== contact.id);
  }

  openAddContact(): void {
    this.showAddContact = true;
    this.addContactStep = 'search';
    this.addContactType = 'WHATSAPP';
    this.addContactValue = '';
    this.addContactLabel = '';
    this.addContactCode = '';
    this.addContactError = null;
    this.suggestions = [];
    this.showSuggestions = false;
  }

  cancelAddContact(): void {
    this.showAddContact = false;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.resendCooldown = 0;
  }

  selectAddContactType(type: ContactType): void {
    this.addContactType = type;
    this.addContactValue = '';
    this.suggestions = [];
    this.showSuggestions = false;
  }

  get addContactPlaceholder(): string {
    return this.addContactType === 'WHATSAPP'
      ? 'Ex: +261 34 00 000 00'
      : 'Ex: nom@exemple.com';
  }

  /** Simule une recherche d'autocomplétion sur un annuaire fictif. */
  onAddContactValueChange(raw: string): void {
    this.addContactValue = raw;
    const term = raw.trim().toLowerCase();

    if (term.length < 2) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }

    this.suggestions = this.fakeDirectory
      .filter(s => s.typeContact === this.addContactType)
      .filter(s => s.value.toLowerCase().includes(term) || s.label.toLowerCase().includes(term))
      .slice(0, 5);

    this.showSuggestions = this.suggestions.length > 0;
  }

  pickSuggestion(sugg: ContactSuggestion): void {
    this.addContactValue = sugg.value;
    this.addContactLabel = sugg.label;
    this.suggestions = [];
    this.showSuggestions = false;
  }

  hideSuggestionsSoon(): void {
    // léger délai pour laisser le clic sur une suggestion s'exécuter avant fermeture
    setTimeout(() => this.showSuggestions = false, 150);
  }

  get isAddContactValueValid(): boolean {
    const v = this.addContactValue.trim();
    if (!v) return false;
    if (this.addContactType === 'EMAIL') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }
    const digits = v.replace(/[^\d]/g, '');
    return digits.length >= 8 && digits.length <= 15;
  }

  submitAddContactSearch(): void {
    if (!this.isAddContactValueValid || this.addContactSubmitting) return;

    this.addContactSubmitting = true;
    this.addContactError = null;

    // Simule l'appel réseau d'envoi du code (données fictives, pas de vrai backend ici)
    setTimeout(() => {
      this.addContactSubmitting = false;
      this.addContactStep = 'verify';
      this.startResendCooldown();
    }, 700);
  }

  resendAddContactCode(): void {
    if (this.resendCooldown > 0 || this.addContactSubmitting) return;
    this.addContactSubmitting = true;

    setTimeout(() => {
      this.addContactSubmitting = false;
      this.startResendCooldown();
    }, 500);
  }

  private startResendCooldown(): void {
    this.resendCooldown = 30;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0 && this.cooldownTimer) clearInterval(this.cooldownTimer);
    }, 1000);
  }

  onAddContactCodeInput(raw: string): void {
    this.addContactCode = raw.replace(/\D/g, '').slice(0, 6);
  }

  get isAddContactCodeValid(): boolean {
    return this.addContactCode.length === 6;
  }

  confirmAddContactCode(): void {
    if (!this.isAddContactCodeValid || this.addContactSubmitting) return;

    this.addContactSubmitting = true;
    this.addContactError = null;

    // Simule la vérification (fictif : accepte n'importe quel code à 6 chiffres)
    setTimeout(() => {
      this.addContactSubmitting = false;

      const newContact: Contact = {
        id: 'c' + Date.now(),
        typeContact: this.addContactType,
        value: this.addContactValue.trim(),
        label: this.addContactLabel.trim() || null,
        isVerified: true,
      };
      this.contacts = [...this.contacts, newContact];
      this.addContactStep = 'success';
    }, 700);
  }

  backToSearchStep(): void {
    this.addContactStep = 'search';
    this.addContactCode = '';
    this.addContactError = null;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.resendCooldown = 0;
  }
}
