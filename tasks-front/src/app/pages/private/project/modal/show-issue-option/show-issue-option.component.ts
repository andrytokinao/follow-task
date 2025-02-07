import {Component, EventEmitter, Input, Output} from '@angular/core';
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {MatMenu, MatMenuItem} from "@angular/material/menu";
import {Issue, Project, User} from "../../../../../type/issue";
import {ViewEditIssueComponent} from "../view-edit-issue/view-edit-issue.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'show-issue-option',
  templateUrl: './show-issue-option.component.html',
  styleUrl: './show-issue-option.component.css'
})
export class ShowIssueOptionComponent {
  @Input() label:string;
  @Input() public issue: Issue;
  public users: User[] = [];
  project: Project | undefined;


  constructor(
    private modalService: NgbModal,
    protected issueService: IssueService,
    private essueService: IssueService,
    public userService: UserService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {

  }
  showPlanning() {
     this.issueService.showPlanning(this.issue);
  }

  showDetails() {
     this.editIssue(this.issue);
  }
  editIssue(issue:Issue){
    if(issue.issueType.level =="PARENT") {
      this.browsIssue(issue);
    } else {
      this.openDialogIssue(issue);
    }
  }
  browsIssue(issue:Issue){
    this.router.navigate(["working/"+this.project.prefix+"/issue/"+issue.issueKey+"/details"])

  }
  openDialogIssue(issue:Issue){
    const dialogRef = this.modalService.open(ViewEditIssueComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.issue = issue;
    dialogRef.componentInstance.users = this.users;
    dialogRef.result.then((result) => {
    })
  }
}
