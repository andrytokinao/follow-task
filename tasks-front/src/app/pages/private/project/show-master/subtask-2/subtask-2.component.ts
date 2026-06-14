import {
  AfterViewInit,
  Component,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfigService } from '../../../../../services/config.service';
import { IssueService } from '../../../../../services/issue.service';
import { UserService } from '../../../../../services/user.service';
import { AuthService } from '../../../../../services/auth.service';
import {
  CustomFieldValue,
  EventApp,
  EventSearchCriteria,
  Issue,
  UsingCustomField
} from '../../../../../type/issue';
import { BehaviorSubject } from 'rxjs';
import { MatMenuTrigger } from '@angular/material/menu';
import { NewIssueFormComponent } from '../../../../../common/new-issue-form/new-issue-form.component';
import { EventsService } from '../../../../../services/events.service';
import { EditEventComponent } from '../../../../../common/edit-event/edit-event.component';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { trigger, transition, style, animate } from '@angular/animations';

interface DotColors { ring: string; track: string; text: string; }

type TabKey = 'comments' | 'attachments' | 'planning' | 'history';

@Component({
  selector: 'app-subtask-2',
  standalone: false,
  templateUrl: './subtask-2.component.html',
  styleUrl: './subtask-2.component.scss',
  animations: [
    trigger('slideInDetail', [
      transition(':enter', [
        style({ transform: 'translateX(32px)', opacity: 0 }),
        animate('240ms cubic-bezier(0.4,0,0.2,1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('180ms cubic-bezier(0.4,0,0.2,1)', style({ transform: 'translateX(32px)', opacity: 0 }))
      ])
    ]),
    trigger('taskRowIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(6px)' }),
        animate('180ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class Subtask2Component implements OnInit, AfterViewInit {

  planningPositions: ConnectedPosition[] = [
    { originX: 'end',   originY: 'top',    overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top',    overlayX: 'end',   overlayY: 'top' },
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top',    overlayX: 'start', overlayY: 'bottom' },
  ];

  // ── Data ────────────────────────────────────────────────────────
  protected parentIssue: Issue;
  subtasks: Issue[] = [];
  loadingSubtask = false;
  selectedTask: Issue | null = null;
  events: EventApp[] = [];
  groupedEvents: {
    label: string; dateKey: string; events: EventApp[];
    isToday: boolean; isPast: boolean; isFuture: boolean;
  }[] = [];
  customFieldValues: CustomFieldValue[] = [];
  currentCustomFieldValue: CustomFieldValue | null = null;
  usingCustomFields: UsingCustomField[] = [];

  // ── UI state ─────────────────────────────────────────────────────
  showDetail    = false;
  isMobile      = false;
  listCollapsed = false;
  activeTab: TabKey = 'comments';

  // ── Inline edit ──────────────────────────────────────────────────
  editingSummary     = false;
  editSummaryValue   = '';
  editingDescription = false;
  editDescriptionValue = '';

  // ── Streams ──────────────────────────────────────────────────────
  private selectedIssueSubject = new BehaviorSubject<Issue>(undefined);
  selectedIssue$ = this.selectedIssueSubject.asObservable();

  // ── Resize (desktop) ────────────────────────────────────────────
  resizing = false;

  // ── View refs ────────────────────────────────────────────────────
  @ViewChild('createSubtaskTrigger') createSubtaskTrigger!: MatMenuTrigger;
  @ViewChild('newIssueForm')         newIssueForm!: NewIssueFormComponent;
  @ViewChild('newEventForm')         newEventForm: EditEventComponent;
  @ViewChild('editEventForm')        editEventForm: EditEventComponent;
  @ViewChild('addPlanningTrigger')   addPlanningTrigger: MatMenuTrigger;
  @ViewChild('editEventMenuTrigger') editEventMenuTrigger: MatMenuTrigger;

  private project: any;
  private profile: any;

  private readonly RING_R    = 12;
  private readonly RING_CIRC = 2 * Math.PI * this.RING_R;

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

  ngOnInit(): void {
    this.checkMobile();
    this.issueService.project$.subscribe(project => this.project = project);
    this.authService.getProfile().subscribe(res => this.profile = res);
    this.issueService.issueMaster$.subscribe(issue => {
      this.parentIssue = issue;
      this.selectedTask = null;
      this.selectedIssueSubject.next(undefined);
      this.showDetail = false;
      this.subtasks = [];
      this.events = [];
      this.groupedEvents = [];
      if (this.parentIssue?.id) this.loadSubtask();
    });
  }

  ngAfterViewInit(): void {}

  @HostListener('window:resize')
  checkMobile(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    if (!wasMobile && this.isMobile) this.showDetail = false;
    if (wasMobile && !this.isMobile && this.subtasks?.length > 0 && !this.selectedTask) {
      this.selectTask(this.subtasks[0]);
    }
  }

  // ── List collapse ─────────────────────────────────────────────────
  toggleList(): void {
    if (this.isMobile) return;
    this.listCollapsed = !this.listCollapsed;
  }

  // ── Task selection ───────────────────────────────────────────────
  selectTask(task: Issue): void {
    this.cancelEditSummary();
    this.cancelEditDescription();
    this.selectedTask = task;
    this.selectedIssueSubject.next(task);
    this.activeTab = 'comments';
    this.loadValues();
    this.loadEvents();
    if (this.isMobile) this.showDetail = true;
  }

  closeDetail(): void {
    this.selectedTask = null;
    this.selectedIssueSubject.next(undefined);
    this.cancelEditSummary();
    this.cancelEditDescription();
    this.showDetail = false;
  }

  backToList(): void {
    this.showDetail = false;
    this.selectedTask = null;
    this.selectedIssueSubject.next(undefined);
    this.cancelEditSummary();
    this.cancelEditDescription();
  }

  // ── Inline edit — Summary ────────────────────────────────────────
  startEditSummary(): void {
    if (!this.selectedTask) return;
    this.editSummaryValue = this.selectedTask?.summary?.toString() || '';
    this.editingSummary = true;
  }

  saveSummary(): void {
    if (!this.selectedTask) return;
    const trimmed = this.editSummaryValue.trim();
    if (!trimmed) { this.cancelEditSummary(); return; }
    this.selectedTask.summary = trimmed;
    this.editingSummary = false;
  }

  cancelEditSummary(): void {
    this.editingSummary = false;
    this.editSummaryValue = '';
  }

  // ── Inline edit — Description ─────────────────────────────────────
  startEditDescription(): void {
    if (!this.selectedTask) return;
    this.editDescriptionValue = this.selectedTask?.description?.toString() || '';
    this.editingDescription = true;
  }

  saveDescription(): void {
    if (!this.selectedTask) return;
    this.selectedTask.description = this.editDescriptionValue;
    this.editingDescription = false;
  }

  cancelEditDescription(): void {
    this.editingDescription = false;
    this.editDescriptionValue = '';
  }

  // ── Data loading ─────────────────────────────────────────────────
  protected loadSubtask(): void {
    this.loadingSubtask = true;
    this.subtasks = [];
    if (!this.parentIssue?.id) { this.loadingSubtask = false; return; }
    this.issueService.loadSubtask(this.parentIssue.id).subscribe(
      issues => {
        this.subtasks = issues || [];
        if (!this.isMobile && this.subtasks.length > 0 && !this.selectedTask) {
          this.selectTask(this.subtasks[0]);
        }
        this.loadingSubtask = false;
      },
      () => { this.subtasks = []; this.loadingSubtask = false; }
    );
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
    const criteria: EventSearchCriteria = { issueIds: [this.selectedIssueSubject.value.id] };
    this.eventService.searchEvents(criteria).subscribe(events => {
      this.events = (events || []).sort((a, b) => {
        if (!a.start) return 1;
        if (!b.start) return -1;
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });
      this.groupedEvents = this.buildGroupedEvents(this.events);
    });
  }

  onMenuOpened(): void {
    this.newIssueForm?.setIsMaster(false);
    this.newIssueForm?.onOpen();
  }

  onPlanningMenuOpened(): void {
    this.newEventForm?.loadNextEvent(this.selectedTask);
  }

  closeCreateSubtaskMenu(): void {
    this.createSubtaskTrigger.closeMenu();
    this.loadSubtask();
  }

  closeEventForm(): void {
    this.addPlanningTrigger.closeMenu();
    this.loadEvents();
  }

  closeEditEventForm(): void {
    this.editEventMenuTrigger?.closeMenu();
    this.loadEvents();
  }

  editEvent(ev: EventApp): void {
    if (this.editEventForm) this.editEventForm.loadEvent(ev.id);
  }

  deleteEvent(ev: EventApp, mouseEvent: MouseEvent): void {
    mouseEvent.stopPropagation();
    if (!confirm(`Supprimer "${ev.title || '(Sans titre)'}" ?`)) return;
  }

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

  openAttachDialog(): void {}

  // ── Ring helpers ──────────────────────────────────────────────────
  getEventColorClass(pct: number | null | undefined): string {
    if (pct == null) return 'cc-none';
    if (pct >= 100)  return 'cc-done';
    if (pct >= 60)   return 'cc-good';
    if (pct >= 30)   return 'cc-mid';
    return 'cc-low';
  }

  getDotColors(pct: number | null | undefined): DotColors {
    if (pct == null) return { ring: '#d1d5db', track: '#f3f4f6', text: '#9ca3af' };
    if (pct >= 100)  return { ring: '#10b981', track: '#d1fae5', text: '#059669' };
    if (pct >= 60)   return { ring: '#4f46e5', track: '#e0e7ff', text: '#4f46e5' };
    if (pct >= 30)   return { ring: '#f59e0b', track: '#fef3c7', text: '#d97706' };
    return { ring: '#ef4444', track: '#fee2e2', text: '#dc2626' };
  }

  getRingDash(pct: number | null | undefined): string {
    const p = Math.max(0, Math.min(100, pct ?? 0));
    const filled = this.RING_CIRC * p / 100;
    return `${(this.RING_CIRC - filled).toFixed(2)} ${filled.toFixed(2)}`;
  }

  getRingOffset(): string { return '0'; }

  // ── Status helpers ────────────────────────────────────────────────
  getStatusKey(issue: Issue): string {
    const status = issue?.status?.displayName?.toLowerCase() ?? '';
    if (status.includes('done') || status.includes('terminé') || status.includes('closed')) return 'done';
    if (status.includes('progress') || status.includes('cours'))  return 'progress';
    if (status.includes('review') || status.includes('révision')) return 'review';
    return 'todo';
  }

  // ── Grouped events ────────────────────────────────────────────────
  private buildGroupedEvents(events: EventApp[]): typeof this.groupedEvents {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const map = new Map<string, EventApp[]>();
  for (const ev of events) {
  const key = ev.start ? new Date(ev.start).toISOString().slice(0, 10) : 'no-date';
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(ev);
}
return Array.from(map.entries()).map(([dateKey, evs]) => {
  let label: string;
  let isToday = false, isPast = false, isFuture = false;
  if (dateKey === 'no-date') { label = 'Sans date'; isFuture = true; }
  else {
    const d = new Date(dateKey);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0)       { label = "Aujourd'hui"; isToday = true; }
    else if (diff === 1)  { label = 'Demain';      isFuture = true; }
    else if (diff === -1) { label = 'Hier';        isPast = true; }
    else if (diff > 1)    { label = this.formatDateLabel(d); isFuture = true; }
    else                  { label = this.formatDateLabel(d); isPast = true; }
  }
  return { label, dateKey, events: evs, isToday, isPast, isFuture };
});
}

private formatDateLabel(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── Resize ───────────────────────────────────────────────────────
startResizing(event: MouseEvent): void {
  if (this.isMobile) return;
this.resizing = true;
document.body.style.cursor = 'col-resize';
}

@HostListener('window:mousemove', ['$event'])
onMouseMove(event: MouseEvent): void {
  if (!this.resizing || this.isMobile) return;
const list      = document.querySelector('.sw-list') as HTMLElement;
const container = document.querySelector('.sw') as HTMLElement;
if (!list || !container) return;
const newWidth = event.clientX - container.getBoundingClientRect().left;
if (newWidth > 200 && newWidth < container.getBoundingClientRect().width * 0.6) {
  list.style.width = `${newWidth}px`;
}
}

@HostListener('window:mouseup')
stopResizing(): void {
  this.resizing = false;
  document.body.style.cursor = 'default';
}
}
