import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import {
  Comment,
  CustomField,
  CustomFieldValue,
  Issue,
  IssueType,
  UserHoursData,
  UsingCustomField
} from '../../../../../type/issue';
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
import { MatMenuTrigger } from '@angular/material/menu';
import { NewIssueFormComponent } from '../../../../../common/new-issue-form/new-issue-form.component';
import { buildFileTree, FILE_CATEGORY_DISPLAY, FolderNode } from '../../../../../type/file-tree';

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
}

export interface FileTypeStat {
  label: string;
  count: number;
  color: string;
  icon: string;
}

/** Un répertoire de premier niveau et le nombre de fichiers qu'il contient, sous-dossiers compris. */
export interface FolderFileStat {
  name: string;
  count: number;
}

// ─────────────────────────────────────────────────
@Component({
  standalone: false,
  selector: 'app-issue-details',
  templateUrl: './issue-details.component.html',
  styleUrl: './issue-details.component.scss',
})
export class IssueDetailsComponent implements OnInit, OnDestroy {

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
  /**
   * Droit lu une seule fois : appeler `hasCredential(...) | async` dans le
   * template créait un nouvel Observable à chaque détection de changement,
   * d'où une boucle de rendus qui faisait clignoter la page.
   */
  canEditField = false;

  // ── Statistics ────────────────────────────────
  subtaskStatusData: SubtaskStatusData[] = [];
  userHoursData: UserHoursData[] = [];
  totalFiles = 0;
  filesByType: FileTypeStat[] = [];
  folderStats: FolderFileStat[] = [];
  /** Fichiers posés directement à la racine, hors de tout répertoire. */
  rootFiles = 0;
  loadingFiles = false;

  /** true tant que la requête des heures est en cours (évite le flash "aucune donnée") */
  loadingUserHours = false;
  userHoursError = false;

  // ── Charts ────────────────────────────────────
  private subtaskChart: Chart | null = null;
  private hoursChart: Chart | null = null;
  private filesChart: Chart | null = null;

  private subtaskCanvas?: HTMLCanvasElement;
  private hoursCanvas?: HTMLCanvasElement;
  private filesCanvas?: HTMLCanvasElement;

  private destroyed = false;

  @ViewChild('createSubtaskTrigger') createSubtaskTrigger?: MatMenuTrigger;
  @ViewChild('newIssueForm') newIssueForm?: NewIssueFormComponent;

  // Les canvas sont sous *ngIf : on redessine dès qu'ils entrent/sortent du DOM.
  // Angular rappelle ces setters à chaque ajout/retrait de vue dans le template,
  // même si le canvas n'a pas changé : on ne redessine que s'il a vraiment changé,
  // sinon le graphe est recréé (et réanimé) en boucle.
  @ViewChild('subtaskChartCanvas')
  set subtaskChartCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (this.subtaskCanvas === ref?.nativeElement) return;
    this.subtaskCanvas = ref?.nativeElement;
    this.scheduleRender(() => this.renderSubtaskChart());
  }

  @ViewChild('userHoursCanvas')
  set userHoursCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (this.hoursCanvas === ref?.nativeElement) return;
    this.hoursCanvas = ref?.nativeElement;
    this.scheduleRender(() => this.renderHoursChart());
  }

  @ViewChild('filesProgressCanvas')
  set filesProgressCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (this.filesCanvas === ref?.nativeElement) return;
    this.filesCanvas = ref?.nativeElement;
    this.scheduleRender(() => this.renderFilesChart());
  }

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

    this.projectGuard.hasCredential(['CAN_EDIT_FIELD'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasRole => this.canEditField = hasRole);

    this.issueService.issueMaster$
      .pipe(takeUntil(this.destroy$))
      .subscribe(issue => {
        this.parentIssue = issue;
        // On repart d'un état propre : sinon les stats de la tâche
        // précédente restent affichées si la nouvelle n'en a pas.
        this.resetStatistics();
        if (this.parentIssue?.id) {
          this.loadValues();
          this.loadComments();
          this.loadSubtasks();
          this.loadFiles();
          this.loadUserHours();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroy$.next();
    this.destroy$.complete();
    this.subtaskChart?.destroy();
    this.hoursChart?.destroy();
    this.filesChart?.destroy();
    this.subtaskChart = this.hoursChart = this.filesChart = null;
  }

  private resetStatistics(): void {
    this.subtasks = [];
    this.subtaskStatusData = [];
    this.userHoursData = [];
    this.totalFiles = 0;
    this.filesByType = [];
    this.folderStats = [];
    this.rootFiles = 0;
    this.userHoursError = false;
    this.renderSubtaskChart();
    this.renderHoursChart();
    this.renderFilesChart();
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

  trackBySubtask(_index: number, sub: Issue): unknown {
    return sub?.id;
  }

  /**
   * Même source que la liste des sous-tâches (sous-tâche 2). L'ancien appel à
   * `getSubtasks`, absent du service, laissait la liste toujours vide.
   */
  loadSubtasks(): void {
    this.issueService.loadSubtask(this.parentIssue.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (subtasks: Issue[]) => {
          this.subtasks = subtasks ?? [];
          this.buildSubtaskStatusData();
          this.renderSubtaskChart();
        },
        error: () => {
          this.subtasks = [];
          this.buildSubtaskStatusData();
          this.renderSubtaskChart();
        },
      });
  }

  onCreateSubtaskOpened(): void {
    this.newIssueForm?.setIsMaster(false);
    this.newIssueForm?.onOpen();
  }

  closeCreateSubtaskMenu(): void {
    this.createSubtaskTrigger?.closeMenu();
    this.loadSubtasks();
  }

  /**
   * Pièces jointes : même arborescence que le menu Dossier. L'ancien appel à
   * `getFiles`, absent du service, laissait le compteur à zéro.
   */
  loadFiles(): void {
    this.loadingFiles = true;
    this.issueService.loadDirectory(this.parentIssue.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: racine => {
          this.loadingFiles = false;
          this.applyFileTree(buildFileTree(racine));
        },
        // Pas encore de dossier pour cette issue : zéro fichier, pas une erreur.
        error: () => {
          this.loadingFiles = false;
          this.applyFileTree(buildFileTree(null));
        },
      });
  }

  private applyFileTree(tree: FolderNode): void {
    this.totalFiles = tree.fileCount();
    this.filesByType = Array.from(tree.countByCategory().entries())
      .map(([category, count]) => ({ ...FILE_CATEGORY_DISPLAY[category], count }))
      .sort((a, b) => b.count - a.count);
    this.folderStats = tree.folders
      .map(folder => ({ name: folder.name, count: folder.fileCount() }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    this.rootFiles = this.totalFiles - this.folderStats.reduce((sum, f) => sum + f.count, 0);
    this.renderFilesChart();
  }

  /** Le graphique des pièces jointes mène au menu Dossier de cette issue. */
  openDossier(): void {
    this.router.navigate(['../sources-files'], { relativeTo: this.route });
  }

  /** Load per-user work hours */
  loadUserHours(): void {
    this.loadingUserHours = true;
    this.userHoursError = false;
    this.issueService.loadUserHours(this.parentIssue.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: hours => {
          this.loadingUserHours = false;
          this.userHoursData = this.normalizeUserHours(hours);
          this.renderHoursChart();
        },
        error: () => {
          this.loadingUserHours = false;
          this.userHoursError = true;
          this.userHoursData = [];
          this.renderHoursChart();
        },
      });
  }

  /**
   * Le backend peut renvoyer null, des minutes nulles ou un `display` absent :
   * on nettoie tout ici pour que le graphe ne reçoive jamais de NaN.
   */
  private normalizeUserHours(hours: UserHoursData[] | null | undefined): UserHoursData[] {
    return (hours ?? [])
      .filter(h => !!h)
      .map(h => {
        const minutes = Number(h.hours);
        const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
        return {
          ...h,
          userName: (h.userName || '').trim() || 'Non assigné',
          hours: safeMinutes,
          display: h.display || this.formatMinutes(safeMinutes),
        };
      })
      .filter(h => h.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }

  // ── Business Logic ────────────────────────────
  protected readonly CustomFieldComponent = CustomFieldComponent;

  // `app-custom-field` a déjà enregistré la valeur avant d'émettre : ce qui
  // arrive ici est le résultat du serveur, pas une demande d'enregistrement.
  // Le rejouer aurait écrit deux fois la même valeur.
  savedCustomFieldValue(values: CustomFieldValue[]): void {
    this.customFieldValues = values ?? this.customFieldValues;
    this.loadValues();
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
      const key = sub?.status?.displayName?.toString() || 'Inconnu';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    this.subtaskStatusData = Array.from(map.entries()).map(([label, count]) => ({
      label,
      count,
      color: this.STATUS_COLORS[label.toLowerCase()] || '#CBD5E1',
    }));
  }

  formatMinutes(totalMinutes: number): string {
    const safe = Number.isFinite(totalMinutes) && totalMinutes > 0 ? Math.round(totalMinutes) : 0;
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  colorForUser(index: number): string {
    return this.USER_PALETTE[index % this.USER_PALETTE.length];
  }

  get hasUserHours(): boolean {
    return this.userHoursData.length > 0;
  }

  get totalUserMinutes(): number {
    return this.userHoursData.reduce((sum, d) => sum + d.hours, 0);
  }

  get totalUserHoursDisplay(): string {
    return this.formatMinutes(this.totalUserMinutes);
  }

  get hasSubtaskStats(): boolean {
    return this.subtaskStatusData.length > 0;
  }

  // ── Chart Rendering ───────────────────────────
  /**
   * Le rendu passe par un setTimeout : les setters @ViewChild sont appelés
   * pendant la détection de changement, on laisse Angular finir son cycle
   * avant de toucher au canvas.
   */
  private scheduleRender(fn: () => void): void {
    setTimeout(() => { if (!this.destroyed) fn(); });
  }

  renderSubtaskChart(): void {
    // Toujours détruire d'abord : sans ça un graphe vidé garde l'ancien rendu.
    this.subtaskChart?.destroy();
    this.subtaskChart = null;
    if (!this.subtaskCanvas || this.subtaskStatusData.length === 0) return;

    this.subtaskChart = new Chart(this.subtaskCanvas, {
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
        animation: { duration: 300 },
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
  }

  renderHoursChart(): void {
    this.hoursChart?.destroy();
    this.hoursChart = null;
    if (!this.hoursCanvas || this.userHoursData.length === 0) return;

    const data = this.userHoursData;
    this.hoursChart = new Chart(this.hoursCanvas, {
      type: 'bar',
      data: {
        labels: data.map(d => d.userName),
        datasets: [{
          label: 'Heures',
          data: data.map(d => +(d.hours / 60).toFixed(2)),
          backgroundColor: data.map((_, i) => this.colorForUser(i) + 'CC'),
          borderColor: data.map((_, i) => this.colorForUser(i)),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              // On lit le snapshot `data`, pas le champ de la classe :
              // un rechargement pendant le survol ne peut plus donner undefined.
              label: ctx => ` ${data[ctx.dataIndex]?.display ?? ''} (hh:mm)`,
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
  }

  renderFilesChart(): void {
    this.filesChart?.destroy();
    this.filesChart = null;
    if (!this.filesCanvas || this.totalFiles === 0) return;

    const data = this.filesByType;
    this.filesChart = new Chart(this.filesCanvas, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: data.map(d => d.color),
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
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} fichier(s)`,
            },
          },
        },
      },
    });
  }
}
