import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {combineLatest, filter, Subject, switchMap, take, takeUntil} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {ToastrService} from 'ngx-toastr';
import {Issue, Project, Status, User} from '../../../../type/issue';
import {IssueService} from '../../../../services/issue.service';
import {AuthService} from '../../../../services/auth.service';
import {ProjectGuard} from '../../../../services/ProjectGuard';
import {filterByAssignees} from '../../../../type/issue-grouping.util';
import {IssueStatusDrop} from '../../../../common/issue-board/issue-board.component';

type TaskView = 'table' | 'board';
/** Filtre de niveau : tout, les demandes seules, ou les sous-tâches seules. */
type LevelFilter = 'all' | 'master' | 'subtask';

/** Un statut tel qu'on le choisit dans le filtre : par nom, avec son nombre. */
interface StatusOption {
  key: string;
  status: Status;
  count: number;
}

/** Ligne du tableau. `nested` : sous-tâche affichée juste sous sa demande. */
export interface TaskRow {
  issue: Issue;
  master: boolean;
  nested: boolean;
}

/**
 * Liste de toutes les tâches du projet, demandes et sous-tâches mêlées. Les
 * demandes ressortent (titre en gras, liseré) et chaque sous-tâche est rangée
 * sous sa demande quand celle-ci est dans la liste ; sinon elle apparaît seule,
 * avec sa demande en rappel.
 *
 * Les filtres s'appliquent côté client, sur les tâches chargées une fois :
 * changer d'assigné ou de statut est instantané, et les compteurs restent
 * justes. L'état (vue, niveau, statuts, assignés, recherche) est porté par
 * l'URL, pour qu'un lien partagé ouvre la même liste.
 */
@Component({
  standalone: false,
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent implements OnInit, OnDestroy {

  /** Valeur d'URL « aucun filtre », distincte d'un paramètre absent (= défaut). */
  private static readonly ALL = 'tous';
  /** Ce qu'on a encore à traiter : les statuts par défaut, reconnus par leur nom
   *  car chaque workflow porte ses propres identifiants. */
  private static readonly DEFAULT_STATUSES = ['ouvert', 'en attente'];
  private static readonly VIEW_KEY = 'taches-vue';

  view: TaskView = 'table';
  levelFilter: LevelFilter = 'all';
  loading = false;

  private allIssues: Issue[] = [];
  /** Recherche + niveau + assignés : sert à compter les tâches par statut. */
  private forStatusCounts: Issue[] = [];
  /** Recherche + niveau + statuts : sert aux avatars du filtre d'assignés. */
  forAssigneeFilter: Issue[] = [];
  /** Résultat affiché. */
  visibleIssues: Issue[] = [];
  rows: TaskRow[] = [];

  searchTerm = '';
  selectedStatusKeys: string[] = [];
  selectedAssigneeIds: string[] = [];
  statusOptions: StatusOption[] = [];

  /** Board : une colonne par nom de statut, et des copies des tâches rattachées
   *  à ces colonnes (voir buildBoard). */
  boardStatuses: Status[] = [];
  boardIssues: Issue[] = [];
  private originalsById = new Map<number, Issue>();

  me: User | undefined;
  private project: Project | undefined;
  private destroy$ = new Subject<void>();
  private urlSync$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private issueService: IssueService,
    private authService: AuthService,
    private projectGuard: ProjectGuard,
    private toastr: ToastrService
  ) {
  }

  get hasActiveFilter(): boolean {
    return !!this.searchTerm.trim() || this.levelFilter !== 'all'
      || this.selectedStatusKeys.length > 0 || this.selectedAssigneeIds.length > 0;
  }

  get isMineOnly(): boolean {
    return !!this.me?.id && this.selectedAssigneeIds.length === 1 && this.selectedAssigneeIds[0] === this.me.id;
  }

  get statusLabel(): string {
    if (!this.selectedStatusKeys.length) {
      return 'Tous les statuts';
    }
    const names = this.selectedStatusKeys
      .map(key => this.statusOptions.find(option => option.key === key)?.status.displayName ?? key);
    return names.length > 2 ? `${names[0]} +${names.length - 1}` : names.join(', ');
  }

  /** Une demande se reconnaît à son type ; sans type chargé, à l'absence de parent. */
  static isMaster(issue: Issue): boolean {
    const level = issue?.issueType?.level;
    return level ? level === 'PARENT' : !issue?.parent;
  }

  ngOnInit(): void {
    this.urlSync$
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(() => this.writeUrl());

    // L'utilisateur connecté est nécessaire avant de lire l'URL : le filtre
    // par défaut, c'est « assigné à moi ».
    combineLatest([
      this.authService.connectedUser$.pipe(filter(user => !!user), take(1)),
      this.route.queryParamMap.pipe(take(1))
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([user, params]) => {
        this.me = user;
        this.readUrl(params);
        this.issueService.project$
          .pipe(filter(project => !!project), takeUntil(this.destroy$))
          .subscribe(project => {
            this.project = project;
            this.load();
          });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------------------------------------------------------
  // Chargement
  // -----------------------------------------------------------------------

  load(): void {
    const project = this.project;
    if (!project) {
      return;
    }
    this.loading = true;
    // Mêmes droits que la liste des demandes : sans « tout voir », on ne
    // reçoit que ses propres tâches.
    this.projectGuard.hasCredential(['PROJECT_MANAGER', 'ADMIN', 'VIEW_ALL_TASK'])
      .pipe(
        // Aucun niveau : demandes et sous-tâches.
        switchMap(canViewAll => this.issueService.searchIssues({
          assigneUsernames: canViewAll || !this.me?.username ? undefined : [this.me.username]
        }, project.id)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: issues => {
          if (this.project?.id !== project.id) {
            return;
          }
          this.loading = false;
          this.allIssues = TaskListComponent.distinct(issues ?? []);
          this.applyFilters();
        },
        error: () => {
          this.loading = false;
          this.toastr.error('Impossible de charger les tâches');
        }
      });
  }

  /** La recherche joint les valeurs de champ : une tâche peut revenir plusieurs fois. */
  private static distinct(issues: Issue[]): Issue[] {
    const seen = new Set<number>();
    return issues.filter(issue => !issue.deleted && issue.id != null && !seen.has(issue.id) && !!seen.add(issue.id));
  }

  // -----------------------------------------------------------------------
  // Filtres
  // -----------------------------------------------------------------------

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.filtersChanged();
  }

  setLevelFilter(level: LevelFilter): void {
    if (this.levelFilter === level) {
      return;
    }
    this.levelFilter = level;
    this.filtersChanged();
  }

  isStatusSelected(key: string): boolean {
    return this.selectedStatusKeys.includes(key);
  }

  toggleStatus(key: string): void {
    this.selectedStatusKeys = this.isStatusSelected(key)
      ? this.selectedStatusKeys.filter(selected => selected !== key)
      : [...this.selectedStatusKeys, key];
    this.filtersChanged();
  }

  clearStatuses(): void {
    this.selectedStatusKeys = [];
    this.filtersChanged();
  }

  onAssigneesChange(ids: string[]): void {
    this.selectedAssigneeIds = ids;
    this.filtersChanged();
  }

  toggleMine(): void {
    this.selectedAssigneeIds = this.isMineOnly || !this.me?.id ? [] : [this.me.id];
    this.filtersChanged();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.levelFilter = 'all';
    this.selectedStatusKeys = [];
    this.selectedAssigneeIds = [];
    this.filtersChanged();
  }

  private filtersChanged(): void {
    this.applyFilters();
    this.urlSync$.next();
  }

  private applyFilters(): void {
    const term = TaskListComponent.normalize(this.searchTerm);
    const base = this.allIssues
      .filter(issue => this.matchesLevel(issue))
      .filter(issue => !term || this.matchesSearch(issue, term));

    this.forStatusCounts = filterByAssignees(base, this.selectedAssigneeIds);
    this.forAssigneeFilter = this.filterByStatus(base);
    this.visibleIssues = filterByAssignees(this.forAssigneeFilter, this.selectedAssigneeIds);
    this.rows = this.buildRows(this.visibleIssues);

    this.statusOptions = this.buildStatusOptions();
    this.buildBoard();
  }

  private matchesLevel(issue: Issue): boolean {
    switch (this.levelFilter) {
      case 'master':
        return TaskListComponent.isMaster(issue);
      case 'subtask':
        return !TaskListComponent.isMaster(issue);
      default:
        return true;
    }
  }

  private matchesSearch(issue: Issue, term: string): boolean {
    return [issue.issueKey, issue.summary, issue.parent?.issueKey, issue.parent?.summary]
      .some(text => TaskListComponent.normalize(text).includes(term));
  }

  private filterByStatus(issues: Issue[]): Issue[] {
    if (!this.selectedStatusKeys.length) {
      return issues;
    }
    return issues.filter(issue => this.selectedStatusKeys.includes(TaskListComponent.statusKey(issue.status)));
  }

  /**
   * Chaque sous-tâche suit sa demande quand celle-ci est affichée. Une
   * sous-tâche dont la demande est filtrée reste à sa place, seule : on ne
   * cache pas une tâche qui répond aux filtres.
   */
  private buildRows(issues: Issue[]): TaskRow[] {
    const shownIds = new Set(issues.map(issue => issue.id));
    const childrenByParent = new Map<number, Issue[]>();
    const roots: Issue[] = [];
    for (const issue of issues) {
      const parentId = issue.parent?.id;
      if (!TaskListComponent.isMaster(issue) && parentId != null && shownIds.has(parentId)) {
        const siblings = childrenByParent.get(parentId);
        siblings ? siblings.push(issue) : childrenByParent.set(parentId, [issue]);
      } else {
        roots.push(issue);
      }
    }
    return roots.flatMap(root => [
      {issue: root, master: TaskListComponent.isMaster(root), nested: false},
      ...(childrenByParent.get(root.id!) ?? []).map(child => ({issue: child, master: false, nested: true}))
    ]);
  }

  /**
   * Statuts proposés : ceux des workflows des tâches, dans leur ordre, plus
   * ceux portés par les tâches. Regroupés par nom — deux workflows ont chacun
   * leur « Ouvert », l'utilisateur n'en voit qu'un. Un statut sélectionné reste
   * proposé même sans tâche, sinon on ne pourrait plus le décocher.
   */
  private buildStatusOptions(): StatusOption[] {
    const options = new Map<string, StatusOption>();
    const add = (status: Status | null | undefined) => {
      const key = TaskListComponent.statusKey(status);
      if (!key) {
        return;
      }
      const existing = options.get(key);
      if (!existing) {
        options.set(key, {key, status: status!, count: 0});
      } else if (!existing.status.color && status!.color) {
        existing.status = status!;
      }
    };
    for (const issue of this.allIssues) {
      (issue.issueType?.curentWorkFlow?.statuses ?? []).forEach(add);
    }
    this.allIssues.forEach(issue => add(issue.status));
    for (const issue of this.forStatusCounts) {
      const option = options.get(TaskListComponent.statusKey(issue.status));
      if (option) {
        option.count++;
      }
    }
    for (const key of this.selectedStatusKeys) {
      if (!options.has(key)) {
        options.set(key, {key, status: {id: -1, displayName: key, icone: undefined}, count: 0});
      }
    }
    return [...options.values()];
  }

  // -----------------------------------------------------------------------
  // Board
  // -----------------------------------------------------------------------

  /**
   * Le board range par identifiant de statut. Pour qu'un même nom ne donne
   * qu'une colonne, il reçoit des copies dont le statut est celui de la
   * colonne ; les originaux restent la référence (voir onStatusDrop). Les
   * cartes suivent l'ordre du tableau : une demande, puis ses sous-tâches.
   * Avec un filtre de statut, seules les colonnes retenues sont affichées.
   */
  private buildBoard(): void {
    const columns = this.statusOptions
      .filter(option => option.status.id > 0)
      .filter(option => !this.selectedStatusKeys.length || this.isStatusSelected(option.key));
    const byKey = new Map(columns.map(option => [option.key, option.status]));

    this.boardStatuses = columns.map(option => option.status);
    this.originalsById = new Map(this.visibleIssues.map(issue => [issue.id!, issue]));
    this.boardIssues = this.rows.map(({issue}) => ({
      ...issue,
      status: byKey.get(TaskListComponent.statusKey(issue.status)) ?? issue.status
    }));
  }

  /** Déplacement optimiste, annulé si le changement de statut échoue. */
  onStatusDrop({issue, status}: IssueStatusDrop): void {
    const original = this.originalsById.get(issue.id!);
    if (!original) {
      return;
    }
    // Le statut de la colonne peut appartenir à un autre workflow : on prend
    // celui du même nom dans le workflow de la tâche.
    const target = (original.issueType?.curentWorkFlow?.statuses ?? [])
      .find((candidate: Status) => TaskListComponent.statusKey(candidate) === TaskListComponent.statusKey(status)) ?? status;
    const previous = original.status;
    original.status = {...target, color: target.color ?? status.color};
    this.applyFilters();
    this.issueService.createActionStatus(original, target).subscribe({
      error: () => {
        original.status = previous;
        this.applyFilters();
        this.toastr.error('Impossible de changer le statut');
      }
    });
  }

  /** Assignation modifiée sur une carte : la copie a été mise à jour, pas l'original. */
  onBoardIssueUpdated(copy: Issue): void {
    const original = this.originalsById.get(copy.id!);
    if (original) {
      original.assigne = copy.assigne;
      original.activeMemberships = copy.activeMemberships;
      original.observerIds = copy.observerIds;
    }
    this.applyFilters();
  }

  // -----------------------------------------------------------------------
  // Tableau
  // -----------------------------------------------------------------------

  onStatusUpdated(issue: Issue, updated: Issue): void {
    if (updated?.status) {
      issue.status = updated.status;
    }
    this.applyFilters();
  }

  onAssigned(): void {
    this.applyFilters();
  }

  /** Demande : …/issue/{clé}/details ; sous-tâche : …/issue/{parent}/subtask/{clé}. */
  openIssue(issue: Issue): void {
    this.issueService.openIssue(issue);
  }

  subtaskCount(issue: Issue): number {
    return issue.children?.length ?? 0;
  }

  trackByRow(_index: number, row: TaskRow): number | undefined {
    return row.issue.id;
  }

  trackByKey(_index: number, option: StatusOption): string {
    return option.key;
  }

  // -----------------------------------------------------------------------
  // Vue
  // -----------------------------------------------------------------------

  setView(view: TaskView): void {
    if (this.view === view) {
      return;
    }
    this.view = view;
    localStorage.setItem(TaskListComponent.VIEW_KEY, view);
    this.urlSync$.next();
  }

  // -----------------------------------------------------------------------
  // URL
  // -----------------------------------------------------------------------

  /**
   * Paramètre absent : valeur par défaut. `tous` : filtre volontairement vide.
   * Sans cette distinction, un utilisateur qui retire tous les filtres les
   * verrait revenir au rechargement.
   */
  private readUrl(params: ParamMap): void {
    const view = params.get('vue') ?? localStorage.getItem(TaskListComponent.VIEW_KEY);
    this.view = view === 'board' ? 'board' : 'table';
    this.searchTerm = params.get('q') ?? '';

    const level = params.get('niveau');
    this.levelFilter = level === 'master' || level === 'subtask' ? level : 'all';

    const statuses = params.getAll('statut');
    this.selectedStatusKeys = !statuses.length
      ? [...TaskListComponent.DEFAULT_STATUSES]
      : statuses.includes(TaskListComponent.ALL) ? [] : statuses.map(TaskListComponent.normalize);

    const assignees = params.getAll('assigne');
    this.selectedAssigneeIds = !assignees.length
      ? (this.me?.id ? [this.me.id] : [])
      : assignees.includes(TaskListComponent.ALL) ? [] : assignees;
  }

  private writeUrl(): void {
    const all = [TaskListComponent.ALL];
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        vue: this.view,
        niveau: this.levelFilter === 'all' ? null : this.levelFilter,
        q: this.searchTerm.trim() || null,
        statut: this.selectedStatusKeys.length ? this.selectedStatusKeys : all,
        assigne: this.selectedAssigneeIds.length ? this.selectedAssigneeIds : all
      }
    });
  }

  // -----------------------------------------------------------------------
  // Utilitaires
  // -----------------------------------------------------------------------

  /** « En Attente », « en attente » et « En attenté » désignent le même statut. */
  private static normalize(value: unknown): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }

  private static statusKey(status: Status | null | undefined): string {
    return TaskListComponent.normalize(status?.displayName);
  }
}
