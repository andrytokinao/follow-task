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
  user: User;
  roUser:boolean = false;
  filteredUsers!: Observable<User[]>;
  userControl = new FormControl();
  roles: string[] = ['Admin', 'Editor', 'Viewer'];
  selectedUser: User;
  selectedRoles: string[] = [];
  members
  memberGroupe: MemberGroupe
  username: string;

  constructor(
    private modalService: NgbModal,
    private userService: UserService,
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
    this.userService.addUserInGroupe(this.userControl.value, this.groupeUser.id, this.selectedRoles).subscribe(res => {
      this.activeModal.close({memberGroupe: res});
      this.memberGroupe = res;
    })
  }

  onFocus() {

  }

  idChecked(role: string): boolean {
    return this.selectedRoles.includes(role);
  }

  onRoleChange(event: any, role: string): void {
    if (event.checked) {
      this.selectedRoles.push(role);
    } else {
      this.selectedRoles = this.selectedRoles.filter(item => item !== role);
      ;
    }
  }

}
