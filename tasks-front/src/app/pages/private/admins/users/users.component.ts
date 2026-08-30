import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Subscription} from "rxjs";
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
  users: User[] = [];
  search: string = '';
  loading: boolean = false;
  sortField: string = 'name';
  sortAsc: boolean = true;
  private subscriptions: Subscription[] = [];

  constructor(private modalService: NgbModal, private userService: UserService) {
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.userService.users$.subscribe(users => this.users = users || []),
      this.userService.usersLoading$.subscribe(loading => this.loading = loading)
    );
    // chargement automatique de la liste a l'ouverture de la page
    this.loadList();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  loadList() {
    this.userService.allUsers(true);
  }

  // -----------------------------------------------------------------
  // Recherche et tri
  // -----------------------------------------------------------------

  get filteredUsers(): User[] {
    const term = (this.search || '').toLowerCase().trim();
    const users = !term ? [...this.users] : this.users.filter(user =>
      this.matches(user.lastName, term) ||
      this.matches(user.firstName, term) ||
      this.matches(user.username, term) ||
      this.matches(user.email, term) ||
      this.matches(user.cin, term) ||
      this.matches(user.contact, term) ||
      this.groupesLabel(user).toLowerCase().includes(term));
    return users.sort((a, b) => this.compare(a, b) * (this.sortAsc ? 1 : -1));
  }

  private matches(value: string | undefined, term: string): boolean {
    return (value || '').toLowerCase().includes(term);
  }

  private compare(a: User, b: User): number {
    switch (this.sortField) {
      case 'username':
        return (a.username || '').localeCompare(b.username || '');
      case 'cin':
        return (a.cin || '').localeCompare(b.cin || '');
      default:
        return this.fullName(a).localeCompare(this.fullName(b));
    }
  }

  sortBy(field: string) {
    if (this.sortField == field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  clearSearch() {
    this.search = '';
  }

  // -----------------------------------------------------------------
  // Affichage
  // -----------------------------------------------------------------

  fullName(user: User): string {
    return ((user.lastName || '') + ' ' + (user.firstName || '')).trim() || (user.username || '');
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
        this.loadList();
      }
    }, () => {
    });
  }
}
