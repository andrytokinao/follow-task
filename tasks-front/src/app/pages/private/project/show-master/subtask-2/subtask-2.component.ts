import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
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
  NotificationApp,
  Status, User,
  UsingCustomField
} from '../../../../../type/issue';
import { BehaviorSubject, forkJoin, of, Subscription } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { filterByAssignees } from '../../../../../type/issue-grouping.util';
import { IssueStatusDrop } from '../../../../../common/issue-board/issue-board.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { NewIssueFormComponent } from '../../../../../common/new-issue-form/new-issue-form.component';
import { EventsService } from '../../../../../services/events.service';
import { EditEventComponent } from '../../../../../common/edit-event/edit-event.component';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService } from '../../../../../services/notification.service';
import { ConfirmationDialogService } from '../../../../../services/confirmation-dialog.service';

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
export class Subtask2Component implements OnInit, AfterViewInit, OnDestroy {

  planningPositions: ConnectedPosition[] = [
    { originX: 'end',   originY: 'top',    overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top',    overlayX: 'end',   overlayY: 'top' },
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top',    overlayX: 'start', overlayY: 'bottom' },
  ];
  urlPhoto(user: User): string {
    return user ? this.userService.getUrlPhoto(user) : null;
  }

  fullName(user: User): string {
    if (!user) return '';
    const first = (user as any).firstName ?? '';
    const last  = (user as any).lastName ?? '';
    return `${first} ${last}`.trim();
  }

  initials(user: User): string {
    if (!user) return '';
    const first = (user as any).firstName?.charAt(0) ?? '';
    const last  = (user as any).lastName?.charAt(0) ?? '';
    return (first + last).toUpperCase();
  }
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

  // ── Filtres & regroupement ───────────────────────────────────────
  /** statuts des workflows des sous-tâches, dans l'ordre du workflow */
  statuses: Status[] = [];
  /** identifiants des assignés retenus ; vide = tout le monde */
  assigneeFilter: string[] = [];
  /** statut retenu dans la liste compacte ; null = tous */
  statusFilter: number | null = null;
  /** sous-tâches passées au filtre d'assignés : alimente le board et les compteurs de statut */
  assigneeFilteredTasks: Issue[] = [];
  /** puis au filtre de statut : lignes de la liste compacte */
  visibleTasks: Issue[] = [];

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
  private routerSubscription?: Subscription;
  private notificationSubscription?: Subscription;

  /** Non lues par tâche, tenues par l'unique liste de NotificationService. */
  private nonLuesParTache = new Map<number, NotificationApp[]>();
  /** Référence stable, pour ne pas relancer *ngFor à chaque détection. */
  private static readonly AUCUNE: NotificationApp[] = [];

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
    private eventService: EventsService,
    private toastr: ToastrService,
    private notificationService: NotificationService,
    private confirmationDialogService: ConfirmationDialogService
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
      this.statuses = [];
      this.assigneeFilter = [];
      this.statusFilter = null;
      this.applyFilters();
      this.events = [];
      this.groupedEvents = [];
      if (this.parentIssue?.id) this.loadSubtask();
    });
    // La tâche ouverte suit l'URL : lien partagé, bouton retour du navigateur…
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.syncSelectionWithUrl());
    this.notificationSubscription = this.notificationService.unreadDetailsByIssue$
      .subscribe(details => {
        this.nonLuesParTache = details;
        // Évènement arrivé sur la sous-tâche qu'on a sous les yeux : il est vu.
        if (this.selectedTask && this.nonLues(this.selectedTask) > 0) {
          this.notificationService.markIssueRead(this.selectedTask.id);
        }
      });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.notificationSubscription?.unsubscribe();
  }

  // ── Notifications ────────────────────────────────────────────────
  /**
   * Nouveautés non ouvertes sur une sous-tâche. Sur cette page on voit la
   * demande et toutes ses sous-tâches : la pastille dit laquelle a bougé,
   * plutôt que de laisser chercher d'où vient celle de la demande.
   */
  nonLues(task: Issue): number {
    return this.detailsNonLues(task).length;
  }

  resumeNonLues(task: Issue): string {
    return this.notificationService.resumeTexte(this.detailsNonLues(task), 'Nouveautés sur cette tâche :');
  }

  private detailsNonLues(task: Issue): NotificationApp[] {
    if (task?.id == null) return Subtask2Component.AUCUNE;
    return this.nonLuesParTache.get(Number(task.id)) ?? Subtask2Component.AUCUNE;
  }

  @HostListener('window:resize')
  checkMobile(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    // Plus de sélection automatique en repassant sur desktop : sans tâche
    // ouverte, c'est le board qui s'affiche.
    if (!wasMobile && this.isMobile) this.showDetail = false;
  }

  /** Board pleine largeur tant qu'aucune tâche n'est ouverte ; liste compacte à côté du détail sinon. */
  get showBoard(): boolean {
    return !this.selectedTask && !this.isMobile;
  }

  // ── List collapse ─────────────────────────────────────────────────
  toggleList(): void {
    if (this.isMobile) return;
    this.listCollapsed = !this.listCollapsed;
  }

  // ── Task selection ───────────────────────────────────────────────
  // L'URL fait foi : sélectionner ou fermer une tâche ne fait que naviguer,
  // syncSelectionWithUrl applique ensuite l'état.
  selectTask(task: Issue): void {
    if (!task?.issueKey) { this.openTask(task); return; }
    this.router.navigate([task.issueKey.toString()], { relativeTo: this.route });
  }

  closeDetail(): void {
    this.router.navigate(['./'], { relativeTo: this.route });
  }

  backToList(): void {
    this.closeDetail();
  }

  /** Clé de la sous-tâche présente dans l'URL (…/subtask/:subtaskKey), sinon null. */
  private get urlSubtaskKey(): string | null {
    return this.route.snapshot.firstChild?.paramMap.get('subtaskKey') ?? null;
  }

  /**
   * La demande parente est chargée par IssueResolverService sans être attendue
   * par le routeur : juste après une navigation, la liste peut encore être
   * celle de la demande précédente.
   */
  private get subtasksMatchUrlParent(): boolean {
    const urlParentKey = this.route.snapshot.pathFromRoot
      .map(r => r.paramMap.get('parrentIssue'))
      .filter(key => !!key)
      .pop();
    return !!this.parentIssue?.id
      && (!urlParentKey || this.parentIssue.issueKey?.toString() === urlParentKey);
  }

  /** Aligne la tâche ouverte sur l'URL, une fois les sous-tâches chargées. */
  private syncSelectionWithUrl(): void {
    if (this.loadingSubtask) return;
    const key = this.urlSubtaskKey;
    if (!key) {
      if (this.selectedTask) this.clearSelection();
      return;
    }
    if (!this.subtasksMatchUrlParent) return;
    const task = this.subtasks.find(t => t.issueKey?.toString() === key);
    if (!task) {
      this.toastr.warning(`La tâche ${key} est introuvable dans cette demande`);
      this.router.navigate(['./'], { relativeTo: this.route, replaceUrl: true });
      return;
    }
    if (this.selectedTask?.id === task.id) {
      // liste rechargée : on garde l'onglet et les données, seule la référence change
      this.selectedTask = task;
      return;
    }
    this.openTask(task);
  }

  private openTask(task: Issue): void {
    this.cancelEditSummary();
    this.cancelEditDescription();
    this.selectedTask = task;
    this.selectedIssueSubject.next(task);
    // Sous-tâche à l'écran : ses notifications sont lues, la pastille de la
    // ligne et celle de la demande s'éteignent ensemble.
    this.notificationService.markIssueRead(task?.id);
    this.activeTab = 'comments';
    this.loadValues();
    this.loadEvents();
    if (this.isMobile) this.showDetail = true;
  }

  private clearSelection(): void {
    this.selectedTask = null;
    this.selectedIssueSubject.next(undefined);
    this.cancelEditSummary();
    this.cancelEditDescription();
    this.showDetail = false;
  }

  // ── Suppression ──────────────────────────────────────────────────
  deleting = false;

  /**
   * Supprime la sous-tâche après confirmation. Le serveur emporte avec elle
   * commentaires, fichiers, planning et historique : d'où la confirmation.
   *
   * La ligne ne quitte la liste qu'une fois la suppression acceptée : en cas
   * de refus, la tâche reste affichée telle quelle, avec un message.
   */
  deleteTask(task: Issue | null): void {
    if (!task?.id || this.deleting) return;
    this.confirmationDialogService
      .confirm(
        `Suppression de "${task.issueKey} · ${task.summary}"`,
        'Commentaires, pièces jointes, planning et historique de cette tâche seront perdus. Voulez-vous la supprimer ?',
        'Supprimer',
        'Annuler'
      )
      .then(confirmed => {
        if (!confirmed) return;
        this.deleting = true;
        this.issueService.removeIssue(task.id).subscribe({
          next: () => {
            this.deleting = false;
            if (this.selectedTask?.id === task.id) this.closeDetail();
            this.subtasks = this.subtasks.filter(t => t.id !== task.id);
            this.applyFilters();
            // Ses notifications ont été supprimées avec elle : sans
            // rechargement, sa pastille resterait sur la demande.
            this.notificationService.reload();
            this.toastr.success(`Tâche ${task.issueKey} supprimée`);
          },
          error: () => {
            this.deleting = false;
            this.toastr.error(`Impossible de supprimer la tâche ${task.issueKey}`);
          }
        });
      })
      .catch(() => undefined);
  }

  /**
   * Changement de type de la sous-tâche, via le formulaire commun. Le parent
   * est transmis : c'est lui qui détermine les sous-types proposés.
   *
   * L'URL porte la clé de la sous-tâche ; si elle change, on rejoint la
   * nouvelle après avoir rechargé la liste.
   */
  changeIssueType(): void {
    const task = this.selectedTask;
    if (!task?.id) return;
    const ancienneCle = task.issueKey;
    this.issueService
      .openChangeIssueType({...task, parent: task.parent ?? this.parentIssue})
      .subscribe(issue => {
        this.selectedTask = {...task, ...issue};
        this.loadSubtask();
        if (issue.issueKey && issue.issueKey !== ancienneCle) {
          // Même navigation que selectTask : …/subtask/{clé}, syncSelectionWithUrl fait le reste.
          this.router.navigate([issue.issueKey.toString()], {relativeTo: this.route});
        }
        this.toastr.success(`Type de ${issue.issueKey} mis à jour`);
      });
  }

  /** L'URL courante est déjà …/subtask/{clé} : c'est le lien à partager. */
  copyTaskLink(): void {
    if (!navigator.clipboard) { this.toastr.error('Impossible de copier le lien'); return; }
    navigator.clipboard.writeText(window.location.href).then(
      () => this.toastr.success('Lien de la tâche copié'),
      () => this.toastr.error('Impossible de copier le lien')
    );
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
        this.applyFilters();
        this.loadStatuses();
        this.loadingSubtask = false;
        this.syncSelectionWithUrl();
      },
      () => { this.subtasks = []; this.applyFilters(); this.loadingSubtask = false; }
    );
  }

  /**
   * LOAD_SUBTASK ne charge pas le workflow des types : on le récupère par
   * type, comme le fait app-status-field. En pratique les sous-tâches d'une
   * même demande partagent un ou deux types, donc une ou deux requêtes.
   */
  private loadStatuses(): void {
    const parentId = this.parentIssue?.id;
    const typeIds = Array.from(new Set(
      this.subtasks.map(task => task.issueType?.id).filter(id => id != null)
    ));
    if (typeIds.length == 0) { this.statuses = []; return; }
    forkJoin(typeIds.map(id =>
      this.issueService.getIssueTypeById(id).pipe(catchError(() => of(null)))
    )).subscribe(types => {
      // réponse arrivée après un changement de demande parente
      if (this.parentIssue?.id !== parentId) return;
      this.statuses = types.flatMap(type => type?.curentWorkFlow?.statuses || []);
    });
  }

  // ── Filtres ──────────────────────────────────────────────────────
  onAssigneeFilterChange(ids: string[]): void {
    this.assigneeFilter = ids;
    this.applyFilters();
  }

  onStatusFilterChange(statusId: number | null): void {
    this.statusFilter = statusId;
    this.applyFilters();
  }

  clearFilters(): void {
    this.assigneeFilter = [];
    this.statusFilter = null;
    this.applyFilters();
  }

  /**
   * À appeler après une modification sur place d'une sous-tâche (statut,
   * assignés) : le board et les compteurs ne se recalculent que sur un
   * changement de référence de la liste.
   */
  refreshTasks(): void {
    this.subtasks = [...this.subtasks];
    this.applyFilters();
  }

  onTaskStatusUpdated(task: Issue, updated: Issue): void {
    if (updated?.status) task.status = updated.status;
    this.refreshTasks();
  }

  /** Déplacement optimiste : la carte change de colonne tout de suite et revient si l'action échoue. */
  onStatusDrop({ issue, status }: IssueStatusDrop): void {
    const previous = issue.status;
    issue.status = status;
    this.refreshTasks();
    this.issueService.createActionStatus(issue, status).subscribe({
      error: () => {
        issue.status = previous;
        this.refreshTasks();
        this.toastr.error('Impossible de changer le statut');
      }
    });
  }

  private applyFilters(): void {
    this.assigneeFilteredTasks = filterByAssignees(this.subtasks, this.assigneeFilter);
    this.visibleTasks = this.statusFilter == null
      ? this.assigneeFilteredTasks
      : this.assigneeFilteredTasks.filter(task => task.status?.id === this.statusFilter);
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
