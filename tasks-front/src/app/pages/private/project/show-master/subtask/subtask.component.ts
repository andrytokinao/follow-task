import {Component, OnInit} from '@angular/core';
import {Issue} from "../../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {NewIssueComponent} from "../../modal/new-issue/new-issue.component";

@Component({
  selector: 'app-subtask',
  templateUrl: './subtask.component.html',
  styleUrl: './subtask.component.css'
})
export class SubtaskComponent implements OnInit{
  private project: any;
  private profile: any;
  private parentIssue: Issue;
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService:ConfigService,
              private issueService:IssueService,
              private userService:UserService,
              private route: ActivatedRoute,
              private authService: AuthService
  ) {
  }
  subtasks: Issue[];
  newSubtask: Issue;

  addSubtask() {
    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.componentInstance.listIssueTypeMaster(this.project.id);
    dialogRef.componentInstance.project = this.project;
    dialogRef.componentInstance.parent = this.parentIssue;
    dialogRef.componentInstance.listIssueTypeSubtasks(this.parentIssue.issueType.id);
    dialogRef.result.then((result) => {
      this.loadSubtask();
    });
  }
  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.parentIssue = data['parrentIssue'];
      this.project = data['project'];
    });
    this.authService.getProfile().subscribe((res)=>{
      this.profile = res;
    });
    this.loadSubtask();
  }

  private loadSubtask() {
    this.issueService.loadSubtask(this.parentIssue.id).subscribe(res => {
      this.subtasks = res;
    })
  }
}
