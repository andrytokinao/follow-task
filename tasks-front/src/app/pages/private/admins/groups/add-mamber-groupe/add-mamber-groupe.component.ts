import {Component, OnInit} from '@angular/core';
import {GroupeUser, MemberGroupe, User} from "../../../../../type/issue";
import {stripTypename} from "@apollo/client/utilities";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UserService} from "../../../../../services/user.service";
import {map, Observable, startWith} from "rxjs";
import {FormControl} from "@angular/forms";
import {MatCheckboxChange} from "@angular/material/checkbox";

@Component({
  selector: 'app-add-mamber-groupe',
  templateUrl: './add-mamber-groupe.component.html',
  styleUrl: './add-mamber-groupe.component.css'
})
export class AddMamberGroupeComponent implements OnInit {
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
        map(value => this._filterUsers(value || '')));
    });

  }

  private _filterUsers(value: string): User[] {
    const filterValue = value.toLowerCase();
    return this.users.filter(user => user =>
      user.firstName.toLowerCase().includes(filterValue) ||
      user.lastName.toLowerCase().includes(filterValue) ||
      user.username.toLowerCase().includes(filterValue));
  }

  displayFn(user: User): string {
    return user && user.username ? user.username : '';
  }

  register() {
    this.user = this.userControl.value || this.memberGroupe.user;
    if (this.user == undefined) {
      alert("Completer l'user  ");
      return;
    }
    this.userService.addUserInGroupe(this.user.username, this.groupeUser.id, this.selectedRoles).subscribe(res => {
      this.activeModal.close({memberGroupe: res});
      this.memberGroupe = res;
    })
  }

  onFocus() {

  }

  idChecked(role: any): boolean {
    if (this.selectedRoles == undefined)
      return false;
    return this.selectedRoles.some(selected => selected === role.value);
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
}
