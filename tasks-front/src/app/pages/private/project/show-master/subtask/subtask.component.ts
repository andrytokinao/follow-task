import {Component, OnInit} from '@angular/core';
import {CustomFieldValue, Issue, User} from "../../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {NewIssueComponent} from "../../modal/new-issue/new-issue.component";
import {ViewEditIssueComponent} from "../../modal/view-edit-issue/view-edit-issue.component";
interface Task {
  id: number;
  title: string;
  type: string;
  icon: string;
  status: 'En cours' | 'Complétée' | 'Non commencée';
  assignedTo: string;
}
@Component({
  selector: 'app-subtask',
  templateUrl: './subtask.component.html',
  styleUrl: './subtask.component.css'
})
export class SubtaskComponent implements OnInit {
  private project: any;
  private profile: any;
  private parentIssue: Issue;
  private currentIssue: null;
  private users: User[] = [];

  constructor(private router: Router,
              private modalService: NgbModal,
              private configService: ConfigService,
              private issueService: IssueService,
              private userService: UserService,
              private route: ActivatedRoute,
              private authService: AuthService
  ) {
  }

  subtasks: Issue[];
  newSubtask: Issue;
  viewModeField: string;
  isLoading: boolean;

  addSubtask() {
    const dialogRef = this.modalService.open(NewIssueComponent);
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
    this.authService.getProfile().subscribe((res) => {
      this.profile = res;

    });
    this.loadSubtask();
  }

  protected loadSubtask() {
    this.issueService.loadSubtask(this.parentIssue.id).subscribe(res => {
      this.subtasks = res;
    })
  }

  toggleTaskStatus(task: Task) {
    if (task.status === 'En cours') task.status = 'Complétée';
    else if (task.status === 'Complétée') task.status = 'Non commencée';
    else task.status = 'En cours';
  }

  deleteTask(id: number) {

  }

  canShowInList(value: CustomFieldValue) {
    if (value == null)
      return false
    if (!(value.values != null || value.string != null || value.text != null || value.user != null || value.numeric != null ||  value.date != null)) {
      return false;
    }
    if (value.customField.configDisplay == null || value.customField.configDisplay.length == 0) {
      return false
    }
    return (value.customField.configDisplay.find(cf =>  cf == 'DisplayInList') != null)
  }

  saveCustomFieldValue($event: CustomFieldValue) {

  }

  editIssue(issue: any) {
    this.openDialogIssue(issue);
  }

  openDialogIssue(issue: Issue) {
    const dialogRef = this.modalService.open(ViewEditIssueComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.issue = issue;
    dialogRef.componentInstance.users = this.users;
    dialogRef.result.then((result) => {
      this.loadSubtask();
    })
  }
}
