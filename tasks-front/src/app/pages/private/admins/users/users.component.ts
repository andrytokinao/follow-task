import {Component, OnInit} from '@angular/core';
import {Issue, User} from "../../../../type/issue";
import {ViewEditIssueComponent} from "../../project/modal/view-edit-issue/view-edit-issue.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ProfileComponent} from "../../profile/profile.component";
import {stripTypename} from "@apollo/client/utilities";
import {UserService} from "../../../../services/user.service";
import {EditUserComponent} from "../edit-user/edit-user.component";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit{
  currentUser: User | null = null;
  users:User[] =[];
  constructor(private modalService: NgbModal, private userService: UserService) {
  }

  editProfile(user:User) {
    const dialogRef = this.modalService.open(EditUserComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.loadUser(user.id);
    dialogRef.componentInstance.action ="Edition d'un utilisateur";
    dialogRef.componentInstance.loadGroupeMember();
    dialogRef.result.then((result) => {
      this.currentUser = null;
    })
  }

  loadList() {
    this.userService.allUsers();
  }

  create() {
    const dialogRef = this.modalService.open(EditUserComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.action ="Nouvel utilisateur";
    dialogRef.componentInstance.isCreate = true;
    dialogRef.result.then((result) => {
      this.currentUser = null;
    })
  }

  getPhoto(user: User):string {
     return this.userService.getUrlPhoto(user);
  }

  ngOnInit(): void {
    this.userService.users$.subscribe(users=> {
      this.users = users;
    })
  }
}
