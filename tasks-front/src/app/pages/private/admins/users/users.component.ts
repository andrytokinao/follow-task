import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {debounceTime, distinctUntilChanged, Subject, Subscription} from "rxjs";
import {MemberGroupe, User} from "../../../../type/issue";
import {UserService} from "../../../../services/user.service";
import {EditUserComponent} from "../edit-user/edit-user.component";

@Component({
  standalone: false,
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit, OnDestroy {

  /** Page courante, telle que le serveur l'a renvoyée. */
  users: User[] = [];
  search: string = '';
  loading: boolean = false;
  erreur = '';

  sortField: string = 'name';
  sortAsc: boolean = true;

  page = 0;
  taille = 20;
  total = 0;
  nbPages = 0;
  readonly taillesPage = [10, 20, 50, 100];

  /**
   * Vrai quand le serveur ne connaît pas `searchUsers` : la page retombe alors
   * sur `allUsers`, filtre et pagine en mémoire. Le comportement visible reste
   * le même, seule la charge change de côté.
   */
  modeLocal = false;
  private tousLesUtilisateurs: User[] = [];

  private saisie$ = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(private modalService: NgbModal, private userService: UserService) {
  }

  ngOnInit(): void {
    // La frappe ne déclenche pas une requête par caractère : sans ce délai,
    // « Rakoto » en lançait six, dont cinq aussitôt périmées.
    this.subscriptions.push(
      this.saisie$
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => {
          this.page = 0;
          this.charger();
        })
    );
    this.charger();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  // -----------------------------------------------------------------
  // Chargement
  // -----------------------------------------------------------------

  charger(): void {
    if (this.modeLocal) {
      this.chargerEnLocal();
      return;
    }
    this.loading = true;
    this.erreur = '';

    this.userService.searchUsers({
      text: this.search?.trim() || undefined,
      page: this.page,
      size: this.taille,
      sortBy: this.sortField,
      sortAsc: this.sortAsc
    }).subscribe({
      next: resultat => {
        this.loading = false;
        this.users = resultat.content ?? [];
        this.page = resultat.page ?? 0;
        this.taille = resultat.size ?? this.taille;
        this.total = resultat.totalElements ?? this.users.length;
        this.nbPages = resultat.totalPages ?? 1;
      },
      error: cause => {
        // `searchUsers` est une requête récente : un serveur qui n'a pas encore
        // été redéployé ne la connaît pas. Plutôt qu'un écran vide, on bascule
        // définitivement sur l'ancienne requête pour la durée de la visite.
        console.warn('[UTILISATEURS] searchUsers indisponible, repli local', cause);
        this.modeLocal = true;
        this.chargerEnLocal();
      }
    });
  }

  /** Repli : `allUsers`, puis filtre, tri et découpe en mémoire. */
  private chargerEnLocal(): void {
    if (this.tousLesUtilisateurs.length) {
      this.appliquerLocalement();
      return;
    }
    this.loading = true;
    this.subscriptions.push(
      this.userService.users$.subscribe(users => {
        this.tousLesUtilisateurs = users ?? [];
        this.appliquerLocalement();
      }),
      this.userService.usersLoading$.subscribe(chargement => this.loading = chargement)
    );
    this.userService.allUsers(true);
  }

  private appliquerLocalement(): void {
    const terme = (this.search || '').toLowerCase().trim();
    const filtres = !terme ? [...this.tousLesUtilisateurs] : this.tousLesUtilisateurs.filter(user =>
      this.contient(user.lastName, terme) ||
      this.contient(user.firstName, terme) ||
      this.contient(user.username, terme) ||
      this.contient(user.email, terme) ||
      this.contient(user.cin, terme) ||
      this.contient(user.contact, terme) ||
      this.groupesLabel(user).toLowerCase().includes(terme));

    filtres.sort((a, b) => this.comparer(a, b) * (this.sortAsc ? 1 : -1));

    this.total = filtres.length;
    this.nbPages = Math.max(1, Math.ceil(this.total / this.taille));
    this.page = Math.min(this.page, this.nbPages - 1);
    this.users = filtres.slice(this.page * this.taille, (this.page + 1) * this.taille);
    this.loading = false;
  }

  private contient(valeur: string | undefined, terme: string): boolean {
    return (valeur || '').toLowerCase().includes(terme);
  }

  private comparer(a: User, b: User): number {
    switch (this.sortField) {
      case 'username':
        return (a.username || '').localeCompare(b.username || '');
      case 'cin':
        return (a.cin || '').localeCompare(b.cin || '');
      default:
        return this.fullName(a).localeCompare(this.fullName(b));
    }
  }

  rafraichir(): void {
    // Le repli garde une copie complète : la vider force une vraie relecture.
    this.tousLesUtilisateurs = [];
    this.charger();
  }

  // -----------------------------------------------------------------
  // Recherche, tri, pagination
  // -----------------------------------------------------------------

  onSearchChange(valeur: string): void {
    this.search = valeur;
    this.saisie$.next(valeur);
  }

  clearSearch(): void {
    if (!this.search) {
      return;
    }
    this.search = '';
    this.page = 0;
    this.charger();
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
    // Le tri porte sur l'ensemble, pas sur la page affichée : on repart de la
    // première, sinon on lirait la deuxième page d'un autre classement.
    this.page = 0;
    this.charger();
  }

  iconeTri(field: string): string {
    if (this.sortField !== field) {
      return 'fa-sort';
    }
    return this.sortAsc ? 'fa-caret-up' : 'fa-caret-down';
  }

  allerA(page: number): void {
    const cible = Math.min(Math.max(0, page), Math.max(0, this.nbPages - 1));
    if (cible === this.page) {
      return;
    }
    this.page = cible;
    this.charger();
  }

  changerTaille(taille: number): void {
    if (taille === this.taille) {
      return;
    }
    this.taille = taille;
    this.page = 0;
    this.charger();
  }

  get premierAffiche(): number {
    return this.total === 0 ? 0 : this.page * this.taille + 1;
  }

  get dernierAffiche(): number {
    return Math.min(this.total, this.page * this.taille + this.users.length);
  }

  /**
   * Fenêtre de numéros autour de la page courante : au-delà de quelques
   * milliers de comptes, aligner un bouton par page devient illisible.
   */
  get pagesVisibles(): number[] {
    const fenetre = 2;
    const debut = Math.max(0, Math.min(this.page - fenetre, this.nbPages - (fenetre * 2 + 1)));
    const fin = Math.min(this.nbPages, debut + fenetre * 2 + 1);
    const pages: number[] = [];
    for (let index = Math.max(0, debut); index < fin; index++) {
      pages.push(index);
    }
    return pages;
  }

  // -----------------------------------------------------------------
  // Affichage
  // -----------------------------------------------------------------

  fullName(user: User): string {
    return ((user.lastName || '') + ' ' + (user.firstName || '')).trim() || (user.username || '');
  }

  initiales(user: User): string {
    const premiere = user?.lastName?.charAt(0) ?? '';
    const seconde = user?.firstName?.charAt(0) ?? '';
    const initiales = (premiere + seconde).trim();
    return initiales ? initiales.toUpperCase() : '?';
  }

  groupesLabel(user: User): string {
    const groupes: MemberGroupe[] = user.groupes || [];
    return groupes
      .map(member => {
        const name = member.groupe ? member.groupe.name : '';
        const roles = member.roles && member.roles.length ? ' (' + member.roles.join(', ') + ')' : '';
        return name + roles;
      })
      .filter(label => label.trim().length > 0)
      .join(' · ');
  }

  getPhoto(user: User): string {
    return this.userService.getUrlPhoto(user);
  }

  trackByUser(index: number, user: User): string {
    return user.id;
  }

  // -----------------------------------------------------------------
  // Modales
  // -----------------------------------------------------------------

  create() {
    const dialogRef = this.modalService.open(EditUserComponent, {windowClass: "xlModal", backdrop: "static", keyboard: false});
    dialogRef.componentInstance.action = "Nouvel utilisateur";
    dialogRef.componentInstance.isCreate = true;
    this.handleResult(dialogRef);
  }

  editProfile(user: User) {
    this.openUser(user, "Edition d'un utilisateur", false);
  }

  viewProfile(user: User) {
    this.openUser(user, "Consultation d'un utilisateur", true);
  }

  private openUser(user: User, action: string, readOnly: boolean) {
    const dialogRef = this.modalService.open(EditUserComponent, {windowClass: "xlModal", backdrop: "static", keyboard: false});
    dialogRef.componentInstance.action = action;
    dialogRef.componentInstance.readOnly = readOnly;
    // loadUser enchaine lui-meme le chargement des groupes une fois l'utilisateur recu
    dialogRef.componentInstance.loadUser(user.id);
    this.handleResult(dialogRef);
  }

  /**
   * Recharge la liste apres un enregistrement ; une fermeture sans
   * enregistrement (dismiss) laisse la liste en l'etat.
   */
  private handleResult(dialogRef: any) {
    dialogRef.result.then((result: any) => {
      if (result && result.saved) {
        this.rafraichir();
      }
    }, () => {
    });
  }
}
