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

  editProfile() {
    const dialogRef = this.modalService.open(ProfileComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.loadComments();
    dialogRef.componentInstance.loadValues();
    dialogRef.componentInstance.allCustomField();
    dialogRef.componentInstance.loadDirectory();
    dialogRef.result.then((result) => {
      this.currentUser = null;
    })
  }

  loadList() {
    this.userService.getUsers("projet").subscribe((res: any) => {
      this.users = stripTypename(res.data.allUsers);
    });
  }
}
