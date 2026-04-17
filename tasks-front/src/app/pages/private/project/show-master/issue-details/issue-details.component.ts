import { Component, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Comment, CustomField, CustomFieldValue, Issue, IssueType, UsingCustomField } from '../../../../../type/issue';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfigService } from '../../../../../services/config.service';
import { IssueService } from '../../../../../services/issue.service';
import { UserService } from '../../../../../services/user.service';
import { AuthService } from '../../../../../services/auth.service';
import { CustomFieldComponent } from '../../../../../common/custom-field/custom-field.component';
import { ProjectGuard } from '../../../../../services/ProjectGuard';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Chart.js — install via: npm install chart.js
import {
  Chart,
  DoughnutController,
  BarController,
  LineController,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(
  DoughnutController, BarController, LineController,
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler
);

// ─────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────
export interface SubtaskStatusData {
  label: string;
  count: number;
  color: string;
  id?: number | string;
}

export interface UserHoursData {
  userName: string;
  hours: number;   // total minutes
  display: string; // "hh:mm"
}

// ─────────────────────────────────────────────────
@Component({
  standalone: false,
  selector: 'app-issue-details',
  templateUrl: './issue-details.component.html',
  styleUrl: './issue-details.component.scss',
})
export class IssueDetailsComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── State ─────────────────────────────────────
  private project: any;
  protected parentIssue: any = {};
  protected parentIssue2: any = {};
  protected issueType: IssueType | undefined;

  customFieldValue: CustomFieldValue | any = {};
  customFieldValues: CustomFieldValue[] = [];
  usingCustomFields: UsingCustomField[] = [];
  values: CustomFieldValue[] = [];
  currentCustomFieldValue: any = null;
  viewModeField: string = 'info-edit';
  activeMenuItem: string = '';
  profile: any = {};

  comment: any = { issue: {}, user: {} };
  comments: Comment[] = [];
  subtasks: Issue[] = [];
  newSubtask: Issue;

  editDescription = false;
  editSummary = false;

  // ── Statistics ────────────────────────────────
  subtaskStatusData: SubtaskStatusData[] = [];
  userHoursData: UserHoursData[] = [];
  totalFiles = 0;
  imageFiles = 0;
  docFiles = 0;

  // ── Charts ────────────────────────────────────
  private subtaskChart: Chart | null = null;
  private hoursChart: Chart | null = null;
  private filesChart: Chart | null = null;
  private chartsReady = false;

  // ── Colors ────────────────────────────────────
  private readonly STATUS_COLORS: Record<string, string> = {
    'todo'        : '#94A3B8',
    'à faire'     : '#94A3B8',
    'in progress' : '#2563EB',
    'en cours'    : '#2563EB',
    'done'        : '#10B981',
    'terminé'     : '#10B981',
    'blocked'     : '#EF4444',
    'bloqué'      : '#EF4444',
    'review'      : '#F59E0B',
    'en révision' : '#F59E0B',
  };

  private readonly USER_PALETTE = [
    '#2563EB', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16',
  ];

  private destroy$ = new Subject<void>();

  // ─────────────────────────────────────────────
  constructor(
    public router: Router,
    private modalService: NgbModal,
    private configService: ConfigService,
    private issueService: IssueService,
    protected userService: UserService,
    private route: ActivatedRoute,
    private authService: AuthService,
    protected projectGuard: ProjectGuard,
  ) {}

  // ─────────────────────────────────────────────
  ngOnInit(): void {
    this.issueService.project$
      .pipe(takeUntil(this.destroy$))
      .subscribe(project => this.project = project);

    this.authService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => this.profile = res);

    this.issueService.issueMaster$
      .pipe(takeUntil(this.destroy$))
      .subscribe(issue => {
        this.parentIssue = issue;
        if (this.parentIssue?.id) {
          this.loadValues();
          this.loadComments();
          this.loadSubtasks();
          this.loadFiles();
          this.loadUserHours();
        }
      });
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data loads
    this.chartsReady = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subtaskChart?.destroy();
    this.hoursChart?.destroy();
    this.filesChart?.destroy();
  }

  // ── Data Loaders ──────────────────────────────
  loadValues(): void {
    this.issueService.getValues(this.parentIssue.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        this.customFieldValues = res;
        this.loadIssueType();
      });
  }

  loadIssueType(): void {
    this.issueService.getIssueTypeById(this.parentIssue.issueType.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(issueType => {
        this.issueType = issueType;
        this.values = (issueType.usingCustomFields || []).map(
          (ucf: UsingCustomField) => this.getCustomFieldValue(ucf.customField)
        );
      });
  }

  loadComments(): void {
    this.issueService.allComment(this.parentIssue.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(comments => this.comments = comments);
  }

  /**
   * Load subtasks — adapt endpoint to your IssueService API.
   * Falls back to empty array if method doesn't exist.
   */
  loadSubtasks(): void {
    const svc = this.issueService as any;
    if (typeof svc.getSubtasks === 'function') {
      svc.getSubtasks(this.parentIssue.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((subtasks: Issue[]) => {
          this.subtasks = subtasks;
          this.buildSubtaskStatusData();
          this.renderSubtaskChart();
        });
    } else {
      this.subtasks = [];
      this.buildSubtaskStatusData();
      this.renderSubtaskChart();
    }
  }

  /** Load file attachments count */
  loadFiles(): void {
    const svc = this.issueService as any;
    if (typeof svc.getFiles === 'function') {
      svc.getFiles(this.parentIssue.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((files: any[]) => {
          this.totalFiles = files.length;
          this.imageFiles = files.filter(f =>
            /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f.name || f.filename || '')
          ).length;
          this.docFiles = this.totalFiles - this.imageFiles;
          this.renderFilesChart();
        });
    }
  }

  /** Load per-user work hours */
  loadUserHours(): void {
    const svc = this.issueService as any;
    if (typeof svc.getUserHours === 'function') {
      svc.getUserHours(this.parentIssue.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: Array<{ user: any; minutes: number }>) => {
          this.userHoursData = data.map(d => ({
            userName: `${d.user?.firstname || ''} ${d.user?.lastname || ''}`.trim(),
            hours: d.minutes,
            display: this.formatMinutes(d.minutes),
          }));
          this.renderHoursChart();
        });
    } else {
      // Demo data when endpoint not yet available
      this.userHoursData = [
        { userName: 'Alice M.', hours: 185, display: '03:05' },
        { userName: 'Bob D.',   hours: 320, display: '05:20' },
        { userName: 'Carol L.', hours: 95,  display: '01:35' },
      ];
      this.renderHoursChart();
    }
  }

  // ── Business Logic ────────────────────────────
  protected readonly CustomFieldComponent = CustomFieldComponent;

  saveCustomFieldValue(event: CustomFieldValue): void {
    this.issueService.saveValues(event)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  getCustomFieldValue(customField: CustomField): CustomFieldValue {
    const found = this.customFieldValues.find(cfv => cfv.customField.id === customField.id);
    return found ?? CustomFieldComponent.newValue(this.parentIssue, customField);
  }

  setViewMode(s: string): void {
    this.viewModeField = s;
  }

  saveIssue(): void {
    this.issueService.saveIssue(this.parentIssue)
      .pipe(takeUntil(this.destroy$))
      .subscribe(issue => {
        this.parentIssue = issue;
        this.editDescription = false;
        this.editSummary = false;
      });
  }

  editIssueDescription(): void {
    this.projectGuard.hasCredential(['CAN_CREATE_TASK'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasRole => { if (hasRole) this.editDescription = true; });
  }

  editIssueSummary(): void {
    this.projectGuard.hasCredential(['CAN_CREATE_TASK'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasRole => { if (hasRole) this.editSummary = true; });
  }

  addComment(): void {
    this.comment.issue.id = this.parentIssue.id;
    this.issueService.addComment(this.comment, undefined, undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadComments();
        this.comment.text = '';
      });
  }

  // ── Statistics Helpers ────────────────────────
  buildSubtaskStatusData(): void {
    const map = new Map<string, number>();
    for (const sub of this.subtasks) {
      const key = sub?.status?.displayName.toString() || 'Unknown';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    this.subtaskStatusData = Array.from(map.entries()).map(([label, count]) => ({
      label,
      count,
      color: this.STATUS_COLORS[label.toLowerCase()] || '#CBD5E1',
    }));
  }

  formatMinutes(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // ── Chart Rendering ───────────────────────────
  uploadedFiles: any[] =[];
  private waitForCanvas(id: string, cb: (el: HTMLCanvasElement) => void): void {
    const attempt = () => {
      const el = document.getElementById(id) as HTMLCanvasElement | null;
      if (el) { cb(el); }
      else { requestAnimationFrame(attempt); }
    };
    attempt();
  }

  renderSubtaskChart(): void {
    if (this.subtaskStatusData.length === 0) return;
    this.waitForCanvas('subtaskStatusChart', (canvas) => {
      this.subtaskChart?.destroy();
      this.subtaskChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: this.subtaskStatusData.map(d => d.label),
          datasets: [{
            data: this.subtaskStatusData.map(d => d.count),
            backgroundColor: this.subtaskStatusData.map(d => d.color),
            borderWidth: 3,
            borderColor: '#fff',
            hoverBorderColor: '#fff',
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.label}: ${ctx.parsed} tâche(s)`,
              },
            },
          },
        },
      });
    });
  }

  renderHoursChart(): void {
    if (this.userHoursData.length === 0) return;
    this.waitForCanvas('userHoursChart', (canvas) => {
      this.hoursChart?.destroy();
      this.hoursChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: this.userHoursData.map(d => d.userName),
          datasets: [{
            label: 'Heures',
            data: this.userHoursData.map(d => +(d.hours / 60).toFixed(2)),
            backgroundColor: this.userHoursData.map((_, i) =>
              this.USER_PALETTE[i % this.USER_PALETTE.length] + 'CC'
            ),
            borderColor: this.userHoursData.map((_, i) =>
              this.USER_PALETTE[i % this.USER_PALETTE.length]
            ),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const d = this.userHoursData[ctx.dataIndex];
                  return ` ${d.display} (hh:mm)`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: '#64748B' },
            },
            y: {
              grid: { color: '#F1F5F9' },
              ticks: {
                font: { size: 11 },
                color: '#64748B',
                callback: v => `${v}h`,
              },
              beginAtZero: true,
            },
          },
        },
      });
    });
  }

  renderFilesChart(): void {
    this.waitForCanvas('filesProgressChart', (canvas) => {
      this.filesChart?.destroy();
      this.filesChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: ['', 'Images', 'Docs', 'Total'],
          datasets: [{
            data: [0, this.imageFiles, this.docFiles, this.totalFiles],
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37,99,235,.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#2563EB',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
          scales: {
            x: { display: false },
            y: { display: false, beginAtZero: true },
          },
        },
      });
    });
  }
}
