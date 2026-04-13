import { Component, HostListener, OnInit, Optional, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfigService } from '../../../../../services/config.service';
import { IssueService } from '../../../../../services/issue.service';
import { UserService } from '../../../../../services/user.service';
import { AuthService } from '../../../../../services/auth.service';
import {
  CustomFieldValue,
  EventApp,
  EventSearchCriteria,
  Issue,
  User,
  UsingCustomField
} from '../../../../../type/issue';
import { BehaviorSubject } from 'rxjs';
import { MatMenuTrigger } from '@angular/material/menu';
import { NewIssueFormComponent } from '../../../../../common/new-issue-form/new-issue-form.component';
import { EventsService } from '../../../../../services/events.service';
import { EditEventComponent } from '../../../../../common/edit-event/edit-event.component';

@Component({
  selector: 'app-subtask-2',
  standalone: false,
  templateUrl: './subtask-2.component.html',
  styleUrl: './subtask-2.component.scss'
})
export class Subtask2Component implements OnInit {

  // ── Data ────────────────────────────────────────────────────────
  protected parentIssue: Issue;
  subtasks: Issue[] = [];
  selectedTask: Issue | null = null;
  events: EventApp[] = [];
  groupedEvents: {
    label: string;
    dateKey: string;
    events: EventApp[];
    isToday: boolean;
    isPast: boolean;
    isFuture: boolean;
  }[] = [];
  customFieldValues: CustomFieldValue[] = [];
  currentCustomFieldValue: CustomFieldValue | null = null;
  usingCustomFields: UsingCustomField[] = [];

  // ── Streams ─────────────────────────────────────────────────────
  private selectedIssueSubject = new BehaviorSubject<Issue>(undefined);
  selectedIssue$ = this.selectedIssueSubject.asObservable();

  // ── Resize state ────────────────────────────────────────────────
  resizing = false;

  // ── View refs ───────────────────────────────────────────────────
  @ViewChild('createSubtaskTrigger') createSubtaskTrigger!: MatMenuTrigger;
  @ViewChild('newIssueForm') newIssueForm!: NewIssueFormComponent;
  @ViewChild('newEventForm') newEventForm: EditEventComponent;
  @ViewChild('addPlanningTrigger') addPlanningTrigger: MatMenuTrigger;

  // ── Private ─────────────────────────────────────────────────────
  private project: any;
  private profile: any;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private configService: ConfigService,
    protected issueService: IssueService,
    private userService: UserService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private eventService: EventsService
  ) {}

  // ── Lifecycle ───────────────────────────────────────────────────
  ngOnInit(): void {
    this.issueService.project$.subscribe(project => this.project = project);

    this.authService.getProfile().subscribe(res => this.profile = res);

    this.issueService.issueMaster$.subscribe(issue => {
      this.parentIssue = issue;
      if (this.parentIssue?.id) {
        this.loadSubtask();
      }
    });
  }

  // ── Task selection ──────────────────────────────────────────────
  selectTask(task: Issue): void {
    this.selectedTask = task;
    this.selectedIssueSubject.next(task);
    this.loadValues();
    this.loadEvents();
  }

  closeDetail(): void {
    this.selectedTask = null;
    this.selectedIssueSubject.next(undefined);
  }

  // ── Data loading ────────────────────────────────────────────────
  protected loadSubtask(): void {
    this.issueService.loadSubtask(this.parentIssue.id).subscribe(issues => {
      this.subtasks = issues;
      if (this.subtasks?.length > 0 && !this.selectedTask) {
        this.selectTask(this.subtasks[0]);
      }
    });
  }

  loadValues(): void {
    if (!this.selectedTask) return;
    this.customFieldValues = [];
    this.issueService.getValues(this.selectedTask.id).subscribe(res => {
      this.customFieldValues = res;
      this.currentCustomFieldValue = undefined;
    });
  }

  loadEvents(): void {
    this.events = [];
    this.groupedEvents = [];
    if (!this.selectedIssueSubject.value?.id) return;

    const criteria: EventSearchCriteria = {
      issueIds: [this.selectedIssueSubject.value.id]
    };
    this.eventService.searchEvents(criteria).subscribe(events => {
      this.events = (events || []).sort((a, b) => {
        if (!a.start) return 1;
        if (!b.start) return -1;
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });
      this.groupedEvents = this.buildGroupedEvents(this.events);
    });
  }

  // ── Menus ───────────────────────────────────────────────────────
  onMenuOpened(): void {
    this.newIssueForm?.onOpen();
  }

  onPlanningMenuOpened(): void {
    alert('opened');
    this.newEventForm.loadNextEvent();
  }

  closeCreateSubtaskMenu(): void {
    this.createSubtaskTrigger.closeMenu();
    this.loadSubtask();
  }

  closeEventForm(): void {
    this.addPlanningTrigger.closeMenu();
    this.loadEvents();
  }

  // ── Custom fields ───────────────────────────────────────────────
  savedCustomFieldValue(values: CustomFieldValue[]): void {
    this.customFieldValues = values;
    this.currentCustomFieldValue = null;
  }

  addCustomFieldValue(usingCustomField: UsingCustomField): void {
    this.currentCustomFieldValue = {
      issue: { id: this.selectedTask.id },
      customField: usingCustomField.customField
    };
  }

  // ── New event helper ─────────────────────────────────────────────
  newEvent(): EventApp {
    return {
      id: null,
      issue: this.selectedIssueSubject.value?.id
        ? { id: this.selectedIssueSubject.value.id }
        : null
    };
  }

  // ── Attachments ─────────────────────────────────────────────────
  openAttachDialog(): void {
    // Open your existing attachment dialog here
  }

  // ── Grouped events builder ───────────────────────────────────────
  private buildGroupedEvents(events: EventApp[]): typeof this.groupedEvents {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const map = new Map<string, EventApp[]>();

  for (const ev of events) {
  const key = ev.start
    ? new Date(ev.start).toISOString().slice(0, 10)
    : 'no-date';
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(ev);
}

return Array.from(map.entries()).map(([dateKey, evs]) => {
  let label: string;
  let isToday = false;
  let isPast = false;
  let isFuture = false;

  if (dateKey === 'no-date') {
    label = 'Sans date';
    isFuture = true;
  } else {
    const d = new Date(dateKey);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);

    if (diffDays === 0)       { label = "Aujourd'hui";  isToday = true; }
    else if (diffDays === 1)  { label = 'Demain';       isFuture = true; }
    else if (diffDays === -1) { label = 'Hier';         isPast = true; }
    else if (diffDays > 1)    { label = this.formatDateLabel(d); isFuture = true; }
    else                      { label = this.formatDateLabel(d); isPast = true; }
  }

  return { label, dateKey, events: evs, isToday, isPast, isFuture };
});
}

private formatDateLabel(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── Resize ──────────────────────────────────────────────────────
startResizing(event: MouseEvent): void {
  this.resizing = true;
  document.body.style.cursor = 'col-resize';
}

@HostListener('window:mousemove', ['$event'])
onMouseMove(event: MouseEvent): void {
  if (!this.resizing) return;
   const list = document.querySelector('.task-list') as HTMLElement;
   const container = document.querySelector('.subtask-wrap') as HTMLElement;
   if (!list || !container) return;
   const containerRect = container.getBoundingClientRect();
   const newWidth = event.clientX - containerRect.left;
    if (newWidth > 200 && newWidth < containerRect.width * 0.6) {
     list.style.width = `${newWidth}px`;
      }
   }

  @HostListener('window:mouseup')
  stopResizing(): void {
    this.resizing = false;
    document.body.style.cursor = 'default';
  }
}
