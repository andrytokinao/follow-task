import {Component, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {CustomFieldValue, Issue, User, UsingCustomField} from "../../../../../type/issue";

@Component({
  selector: 'app-subtask-2',
  standalone: false,
  templateUrl: './subtask-2.component.html',
  styleUrl: './subtask-2.component.scss'
})
export class Subtask2Component implements OnInit {
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService: ConfigService,
              protected issueService: IssueService,
              private userService: UserService,
              private route: ActivatedRoute,
              private authService: AuthService
  ) {
  }

  private project: any;
  private profile: any;
  protected parentIssue: Issue;
  private currentIssue: null;
  private users: User[] = [];
  usingCustomFields :UsingCustomField[] = [];
  currentCustomFieldValue:CustomFieldValue | null = null ;
  customFieldValues:CustomFieldValue[] = [];

  subtasks: Issue[];
  newSubtask: Issue;
  viewModeField: string;
  isLoading: boolean;


  selectedTask: Issue | null = null;
  resizing = false;
  selectTask(task: any) {
    this.selectedTask = task;
    this.loadValues();
  }

  startResizing(event: MouseEvent) {
    this.resizing = true;
    document.body.style.cursor = 'col-resize';
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.resizing) return;
    const list = document.querySelector('.task-list') as HTMLElement;
    const container = document.querySelector('.subtask-container') as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const newWidth = event.clientX - containerRect.left;
    if (newWidth > 200 && newWidth < containerRect.width * 0.6) {
      list.style.width = `${newWidth}px`;
    }
  }

  @HostListener('window:mouseup')
  stopResizing() {
    this.resizing = false;
    document.body.style.cursor = 'default';
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
    });
    this.issueService.project$.subscribe(project=> this.project = project)
    this.authService.getProfile().subscribe((res) => {
      this.profile = res;

    });
    this.issueService.issueMaster$.subscribe(issue => {
      this.parentIssue = issue;
      if (this.parentIssue?.id) {
        this.loadSubtask();
      }

    })

  }
  protected loadSubtask() {
    this.issueService.loadSubtask(this.parentIssue.id).subscribe(issues => {
      this.subtasks = issues;
      if (this.subtasks && this.subtasks.length > 0 && !this.selectedTask) {
        this.selectTask(this.subtasks[0]);
      }
    });
  }

  savedCustomFieldValue(values: CustomFieldValue[]) {
    this.customFieldValues = values;
    this.currentCustomFieldValue = null;
  }
  loadValues(){
    if (!this.selectedTask)
      return;
    this.customFieldValues = [];

    this.issueService.getValues(this.selectedTask.id).subscribe(res => {
        this.customFieldValues = res;
        this.currentCustomFieldValue = undefined;
      }
    );
  }
  addCustomFieldValue(usingCustomField:UsingCustomField) {
    this.currentCustomFieldValue = {
      issue:{id:this.selectedTask.id},
      customField:usingCustomField.customField
    };
  }

}
