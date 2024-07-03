import {Component} from '@angular/core';
import {Issue, User} from "../../../../type/issue";
import {ViewEditIssueComponent} from "../../project/modal/view-edit-issue/view-edit-issue.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ProfileComponent} from "../../profile/profile.component";
import {stripTypename} from "@apollo/client/utilities";
import {UserService} from "../../../../services/user.service";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent {
  currentUser: User | null = null;
  users:User[] =[];
  constructor(private modalService: NgbModal, private userService: UserService) {
    this.loadList();
  }

  editProfile(user:User) {
    const dialogRef = this.modalService.open(ProfileComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.user = user;
    dialogRef.componentInstance.action ="Edition d'un utilisateur";
    dialogRef.componentInstance.loadGroupeMember();
    dialogRef.result.then((result) => {
      this.currentUser = null;
    })
  }

  loadList() {
    this.userService.getUsers("projet").subscribe((res: any) => {
      this.users = stripTypename(res.data.allUsers);
    });
  }

  create() {
    const dialogRef = this.modalService.open(ProfileComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.action ="Nouvel utilisateur";
    dialogRef.componentInstance.isCreate = true;
    dialogRef.result.then((result) => {
      this.currentUser = null;
    })
  }

  getPhoto(user: User):string {
     return this.userService.getUrlPhoto(user);
  }
}
