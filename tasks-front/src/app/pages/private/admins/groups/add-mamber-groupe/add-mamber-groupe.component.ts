import {Component, OnInit} from '@angular/core';
import {GroupeUser, MemberGroupe, Permission, User} from "../../../../../type/issue";
import {stripTypename} from "@apollo/client/utilities";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UserService} from "../../../../../services/user.service";
import {catchError, forkJoin, map, Observable, of, startWith} from "rxjs";
import {FormControl} from "@angular/forms";
import {MatCheckboxChange} from "@angular/material/checkbox";

@Component({
  standalone: false,
  selector: 'app-add-mamber-groupe',
  templateUrl: './add-mamber-groupe.component.html',
  styleUrl: './add-mamber-groupe.component.css'
})
export class AddMamberGroupeComponent implements OnInit {
  permission : Permission;
  groupeUser: GroupeUser;
  users: User[] = [];
  user: User ;
  roUser:boolean = false;
  filteredUsers!: Observable<User[]>;
  userControl = new FormControl();
  roles: any[] = [
    {value:'ADMIN', affichage:"Admin de l'espace de travail"},
    {value:'PROJECT_MANAGER', affichage:"Manager de l'espace de travail "},
    {value:'TEAM_MEMBER', affichage:"Quipe qui peut assiger pour tous les projets et taches"},
    {value:'OBSERVER', affichage:"Lectute seul"},
    {value:'EXTERNAL_USER', affichage:"Utilisateur exterieur , qui peut voire et commenter certaine projet "},
  ];
  selectedUser: User;
  /** Ajout : personnes choisies, qui recevront toutes les memes roles. */
  selectedUsers: User[] = [];
  enregistrement = false;
  erreur = '';
  selectedRoles: string[] = [];
  members
  memberGroupe: MemberGroupe
  username: string;

  constructor(
    private modalService: NgbModal,
    protected userService: UserService,
    public activeModal: NgbActiveModal
  ) {

  }

  loadList() {

  }

  ngOnInit() {
    this.loadList();
    this.userService.users$.subscribe((users: any) => {
      this.users = users;
      this.filteredUsers = this.userControl.valueChanges.pipe(
        startWith(''),
        map(value => this.filterUsers(typeof value === 'string' ? value : '')));
    });
    this.userService.permissionTask$.subscribe(permission=> {
      this.permission = permission;
    })
    this.userService.loadPermissiontTask();


  }



  displayFn(user: User): string {
    return user && user.username ? user.username : '';
  }

  register() {
    if (!this.isEdition()) {
      this.registerSelection();
      return;
    }
    this.user = this.user || this.memberGroupe.user;
    if (this.user == undefined) {
      return;
    }
    this.userService.addUserInGroupe(this.user.username, this.groupeUser.id, this.selectedRoles).subscribe(res => {
      this.activeModal.close({memberGroupe: res});
      this.memberGroupe = res;
    })
  }

  isEdition(): boolean {
    return this.memberGroupe != undefined && this.memberGroupe.id != undefined;
  }

  /**
   * Le serveur n'ajoute qu'une personne a la fois : un appel par personne.
   * Les reussites restent acquises ; seules les personnes en echec restent
   * selectionnees pour pouvoir reessayer.
   */
  private registerSelection() {
    if (this.selectedUsers.length === 0 || this.enregistrement) {
      return;
    }
    this.enregistrement = true;
    this.erreur = '';
    const ajouts = this.selectedUsers.map(user =>
      this.userService.addUserInGroupe(user.username, this.groupeUser.id, this.selectedRoles).pipe(
        catchError(error => {
          console.error("addUserInGroupe ==> ", error);
          return of(null);
        })));
    forkJoin(ajouts).subscribe(resultats => {
      const echecs = this.selectedUsers.filter((_, index) => resultats[index] == null);
      if (echecs.length === 0) {
        this.activeModal.close({memberGroupes: resultats});
        return;
      }
      this.selectedUsers = echecs;
      this.erreur = 'Ajout impossible pour : ' + echecs.map(user => user.firstName + ' ' + user.lastName).join(', ');
      this.enregistrement = false;
    });
  }

  removeSelected(user: User) {
    this.selectedUsers = this.selectedUsers.filter(selected => selected.username !== user.username);
  }

  isMember(user: User): boolean {
    return !!this.groupeUser?.members?.some(member => member.user?.username === user.username);
  }

  onFocus() {

  }

  idChecked(role: any): boolean {
    if (this.selectedRoles == undefined)
      return false;
    return this.selectedRoles.some(selected => selected === role.name);
  }


  onRoleChange(event: any, role: string): void {
    if (event.checked) {
      this.selectedRoles.push(role);
    } else {
      this.selectedRoles = this.selectedRoles.filter(item => item !== role);
      ;
    }
  }
  setMember(member:MemberGroupe) {
    this.memberGroupe = member;
    this.selectedRoles = member.roles || [];
  }

  selectUsert(user: User) {
    this.user = user;
    if (!this.selectedUsers.some(selected => selected.username === user.username)) {
      this.selectedUsers = [...this.selectedUsers, user];
    }
    // Champ vide apres chaque choix : on enchaine directement la personne suivante.
    this.userControl.setValue('');
  }

  filterUsers(value: string): User[] {
    const filterValue = value.toLowerCase();
    // Ni les membres du groupe ni les personnes deja choisies ne sont reproposes.
    let fileted= this.users.filter(user => !this.isMember(user)
      && !this.selectedUsers.some(selected => selected.username === user.username)).filter( user =>
      user.firstName.toLowerCase().includes(filterValue) ||
      user.lastName.toLowerCase().includes(filterValue) ||
      user.username.toLowerCase().includes(filterValue));
    console.debug("_filterUsers => ",fileted)

    return fileted;
  }
}
