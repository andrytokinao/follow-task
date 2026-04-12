import {Component, HostListener, OnInit, Optional, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {
  CustomFieldValue,
  EventApp,
  EventSearchCriteria,
  Issue,
  User,
  UsingCustomField
} from "../../../../../type/issue";
import {BehaviorSubject} from "rxjs";
import {MatMenuTrigger} from "@angular/material/menu";
import {NewIssueFormComponent} from "../../../../../common/new-issue-form/new-issue-form.component";
import {EventsService} from "../../../../../services/events.service";
import {EditEventComponent} from "../../../../../common/edit-event/edit-event.component";

@Component({
  selector: 'app-subtask-2',
  standalone: false,
  templateUrl: './subtask-2.component.html',
  styleUrl: './subtask-2.component.scss'
})
export class Subtask2Component implements OnInit {
  private events: EventApp[];
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService: ConfigService,
              protected issueService: IssueService,
              private userService: UserService,
              private route: ActivatedRoute,
              private authService: AuthService,
              private eventService:EventsService
  ) {
  }

  private project: any;
  private profile: any;
  protected parentIssue: Issue;
  private currentIssue: null;
  private users: User[] = [];
  private selectedIssueSubject = new BehaviorSubject<Issue>(undefined);
  selectedIssue$ = this.selectedIssueSubject.asObservable();
  usingCustomFields :UsingCustomField[] = [];
  currentCustomFieldValue:CustomFieldValue | null = null ;
  customFieldValues:CustomFieldValue[] = [];
  @ViewChild('createSubtaskTrigger') createSubtaskTrigger!: MatMenuTrigger;
  @ViewChild('newIssueForm') newIssueForm!: NewIssueFormComponent;
  @ViewChild('newEventForm') newEventForm:EditEventComponent;
  @ViewChild('addPlanningTrigger') addPlanningTrigger:MatMenuTrigger;

  closeCreateSubtaskMenu() {
    this.createSubtaskTrigger.closeMenu();
    this.loadSubtask();
  }
  subtasks: Issue[];
  newSubtask: Issue;
  viewModeField: string;
  isLoading: boolean;


  selectedTask: Issue | null = null;
  resizing = false;
  selectTask(task: any) {
    this.selectedTask = task;
    this.selectedIssueSubject.next(task);
    this.loadValues();
    this.loadEvents();
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
  onMenuOpened() {
    if (this.newIssueForm) {
      this.newIssueForm.onOpen();   // 🔥 Call the method in child component
    }
  }

  newEvent(): EventApp {
    return {
      id: null,
      issue: this.selectedIssueSubject.value?.id ? { id: this.selectedIssueSubject.value.id } : null
    };
  }
  loadEvents(){
    this.events = [];
    let eventCriteria:EventSearchCriteria = {
      issueIds:[this.selectedIssueSubject.value.id]
    }
    this.eventService.searchEvents(eventCriteria).subscribe( events => {
      this.events = events;
      alert(JSON.stringify(events));
    })
  };
  closeEventForm(){
    this.addPlanningTrigger.closeMenu();
    this.loadEvents();
  }
}
