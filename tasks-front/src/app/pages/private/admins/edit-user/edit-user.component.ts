import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { UserService } from "../../../../services/user.service";
import { ConfirmationDialogService } from "../../../../services/confirmation-dialog.service";
import { GroupeUser, MemberGroupe, User } from "../../../../type/issue";
import { environment } from "../../../../../environments/environment";

@Component({
  standalone: false,
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent implements OnInit {

  constructor(
    private userService: UserService,
    public activeModal: NgbActiveModal,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  /** '' | 'success' | 'error' */
  savingStatus: string = '';
  errorMessage: string = '';
  tempPhoto: string | ArrayBuffer | null = null;
  user: User | any = {};
  action: string = "";
  memberGroupes: MemberGroupe[] = [];
  selectedPhoto: File | any = null;
  isCreate: boolean = false;
  /** mode consultation : aucun champ modifiable */
  readOnly: boolean = false;
  loading: boolean = false;
  saving: boolean = false;
  /** etat du formulaire au chargement, pour detecter les modifications */
  private snapshot: string = '';
  submitted: boolean = false;

  // ---- gestion des groupes ----
  groupes: GroupeUser[] = [];
  showAddGroupe: boolean = false;
  selectedGroupeId: number | null = null;
  selectedRoles: string[] = [];
  availableRoles: any[] = [
    {value: 'ADMIN', affichage: "Admin de l'espace de travail"},
    {value: 'PROJECT_MANAGER', affichage: "Manager de l'espace de travail"},
    {value: 'TEAM_MEMBER', affichage: "Equipe : peut assigner sur tous les projets"},
    {value: 'OBSERVER', affichage: "Lecture seule"},
    {value: 'EXTERNAL_USER', affichage: "Utilisateur externe : consultation et commentaires"},
    {value: 'STANDARD_USER', affichage: "Utilisateur standard"}
  ];

  ngOnInit(): void {
    this.takeSnapshot();
  }

  // -----------------------------------------------------------------
  // Chargement
  // -----------------------------------------------------------------

  /**
   * Charge l'utilisateur puis ses groupes : les deux appels sont chaines
   * car l'identifiant n'est connu qu'apres la reponse du serveur.
   */
  loadUser(userId: string) {
    this.loading = true;
    this.userService.getUser(userId).subscribe({
      next: (user: User) => {
        this.user = user || {};
        this.loading = false;
        this.takeSnapshot();
        if (this.user.id) {
          this.loadGroupeMember();
        }
      },
      error: (error) => {
        this.loading = false;
        this.showError(error, "Impossible de charger l'utilisateur");
      }
    });
  }

  loadGroupeMember() {
    if (!this.user?.id) {
      return;
    }
    this.userService.getGroupeMember(this.user.id).subscribe({
      next: (memberGroupes: MemberGroupe[]) => {
        this.memberGroupes = memberGroupes || [];
      },
      error: (error) => {
        console.error("loadGroupeMember: ", error);
      }
    });
  }

  // -----------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------

  /** Format attendu par le back : (261|0)(32|33|34|38) + 7 chiffres */
  private isValidContact(contact: string): boolean {
    if (!contact) {
      return true;
    }
    return /^(261|0)(32|33|34|38)\d{7}$/.test(contact.replace(/[\s+]/g, ''));
  }

  get errors(): { [key: string]: string } {
    const errors: { [key: string]: string } = {};
    if (!this.user?.username || !('' + this.user.username).trim()) {
      errors['username'] = "Le nom d'utilisateur est obligatoire";
    }
    if (!this.user?.lastName || !('' + this.user.lastName).trim()) {
      errors['lastName'] = "Le prénom est obligatoire";
    }
    if (this.user?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.user.email)) {
      errors['email'] = "Adresse e-mail invalide";
    }
    if (!this.isValidContact(this.user?.contact)) {
      errors['contact'] = "Numéro invalide (ex : 0341234567)";
    }
    if (this.isCreate && (!this.user?.password || this.user.password.length < 4)) {
      errors['password'] = "Mot de passe obligatoire (4 caractères minimum)";
    }
    return errors;
  }

  get isValid(): boolean {
    return Object.keys(this.errors).length == 0;
  }

  showErrorFor(field: string): boolean {
    return this.submitted && !!this.errors[field];
  }

  // -----------------------------------------------------------------
  // Enregistrement / fermeture
  // -----------------------------------------------------------------

  private takeSnapshot() {
    this.snapshot = JSON.stringify(this.user || {});
  }

  get isDirty(): boolean {
    return this.snapshot != JSON.stringify(this.user || {}) || this.tempPhoto != null;
  }

  saveUser() {
    this.submitted = true;
    this.errorMessage = '';
    if (this.readOnly || !this.isValid || this.saving) {
      return;
    }
    this.saving = true;
    this.userService.saveUser(this.user).subscribe({
      next: (res: any) => {
        const saved: User = res?.data?.saveUser || this.user;
        this.user = {...this.user, ...saved};
        this.savingStatus = 'success';
        this.takeSnapshot();
        // la photo n'est televersable qu'une fois l'identifiant connu
        if (this.selectedPhoto && this.user.id) {
          this.uploadPhoto(() => this.closeAfterSave());
        } else {
          this.closeAfterSave();
        }
      },
      error: (error) => {
        this.saving = false;
        this.savingStatus = 'error';
        this.showError(error, "L'enregistrement a échoué");
      }
    });
  }

  private closeAfterSave() {
    this.saving = false;
    // court delai pour laisser le message de succes visible
    setTimeout(() => {
      this.activeModal.close({saved: true, user: this.user});
    }, 600);
  }

  /**
   * Ferme le formulaire en demandant confirmation si des modifications
   * n'ont pas ete enregistrees.
   */
  close() {
    if (!this.isDirty || this.readOnly) {
      this.activeModal.dismiss('cancel');
      return;
    }
    this.confirmationDialog.confirm(
      'Modifications non enregistrées',
      'Vos modifications seront perdues. Voulez-vous vraiment fermer ce formulaire ?',
      'Fermer sans enregistrer',
      'Continuer l\'édition'
    ).then((confirmed) => {
      if (confirmed) {
        this.activeModal.dismiss('cancel');
      }
    }).catch(() => {
      // dialogue ferme : on reste sur le formulaire
    });
  }

  // -----------------------------------------------------------------
  // Photo
  // -----------------------------------------------------------------

  photoUrl() {
    if (this.tempPhoto) return this.tempPhoto;
    if (this.user?.photo) {
      return environment.apiURL + 'photo/' + this.user.photo;
    }
    return 'assets/photo.png';
  }

  selectPhoto($event: any) {
    const file: File = $event?.target.files[0];
    if (file) {
      this.selectedPhoto = file;
      this.previewImage(file);
    }
  }

  previewImage(file: File): void {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.tempPhoto = reader.result;
    };
  }

  openPhotoInput(): void {
    if (this.readOnly) {
      return;
    }
    document.getElementById('photoInput')?.click();
  }

  uploadPhoto(done?: () => void) {
    if (!this.selectedPhoto || !this.user?.id) {
      if (done) done();
      return;
    }
    this.userService.upload(this.selectedPhoto, this.user.id).subscribe({
      next: () => {
        this.tempPhoto = null;
        this.selectedPhoto = null;
        if (done) done();
      },
      error: (error) => {
        this.showError(error, "Le téléversement de la photo a échoué");
        if (done) done();
      }
    });
  }

  // -----------------------------------------------------------------
  // Groupes et roles
  // -----------------------------------------------------------------

  toggleAddGroupe() {
    this.showAddGroupe = !this.showAddGroupe;
    this.selectedGroupeId = null;
    this.selectedRoles = [];
    if (this.showAddGroupe && this.groupes.length == 0) {
      this.userService.allGroupes().subscribe({
        next: (groupes: GroupeUser[]) => this.groupes = groupes || [],
        error: (error) => this.showError(error, "Impossible de charger les groupes")
      });
    }
  }

  onRoleChange(role: string, checked: boolean) {
    if (checked) {
      if (!this.selectedRoles.includes(role)) {
        this.selectedRoles.push(role);
      }
    } else {
      this.selectedRoles = this.selectedRoles.filter(item => item != role);
    }
  }

  addGroupe() {
    if (!this.selectedGroupeId || !this.user?.username) {
      return;
    }
    this.userService.addUserInGroupe(this.user.username, this.selectedGroupeId, this.selectedRoles)
      .subscribe({
        next: () => {
          this.showAddGroupe = false;
          this.selectedGroupeId = null;
          this.selectedRoles = [];
          this.loadGroupeMember();
        },
        error: (error) => this.showError(error, "L'ajout au groupe a échoué")
      });
  }

  removeGroupe(memberGroupe: MemberGroupe) {
    if (this.readOnly || memberGroupe.id == null) {
      return;
    }
    const name = memberGroupe.groupe ? memberGroupe.groupe.name : '';
    this.confirmationDialog.confirm(
      'Retirer du groupe',
      `Retirer ${this.displayName()} du groupe ${name} ?`,
      'Retirer',
      'Annuler'
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.userService.deleteMember(<number>memberGroupe.id).subscribe({
        next: () => this.loadGroupeMember(),
        error: (error) => this.showError(error, "La suppression a échoué")
      });
    }).catch(() => {
    });
  }

  displayName(): string {
    const name = ((this.user?.lastName || '') + ' ' + (this.user?.firstName || '')).trim();
    return name || this.user?.username || '';
  }

  private showError(error: any, fallback: string) {
    this.savingStatus = 'error';
    const graphQlMessage = error?.graphQLErrors?.length ? error.graphQLErrors[0].message : null;
    this.errorMessage = graphQlMessage || error?.message || fallback;
    console.error(fallback, error);
  }
}
