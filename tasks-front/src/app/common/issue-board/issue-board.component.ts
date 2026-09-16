import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {Subscription} from "rxjs";
import {Issue, NotificationApp, Status} from "../../type/issue";
import {groupByStatus, resolveStatuses} from "../../type/issue-grouping.util";
import {NotificationService} from "../../services/notification.service";

export interface IssueStatusDrop {
  issue: Issue;
  status: Status;
}

/**
 * Board kanban présentatif : une colonne par statut, cartes glissables.
 * Il n'enregistre rien — un dépôt est remonté via `statusDrop`, et le parent
 * choisit comment le persister et gère le retour arrière en cas d'échec.
 *
 * Les colonnes sont recalculées quand `issues` change de référence : après
 * une modification sur place, le parent doit repasser une nouvelle liste.
 */
@Component({
  standalone: false,
  selector: 'app-issue-board',
  templateUrl: './issue-board.component.html',
  styleUrl: './issue-board.component.css'
})
export class IssueBoardComponent implements OnInit, OnChanges, OnDestroy {

  /**
   * Nouveautés non ouvertes, lues dans l'unique liste de NotificationService.
   * Le board ne marque rien comme lu : c'est l'écran qui ouvre la tâche qui
   * le fait. Il se contente de montrer quelle carte a bougé.
   */
  private nonLuesParTache = new Map<number, NotificationApp[]>();
  private static readonly AUCUNE: NotificationApp[] = [];
  private notificationSubscription?: Subscription;

  constructor(private notificationService: NotificationService) {
  }

  ngOnInit(): void {
    this.notificationSubscription = this.notificationService.unreadDetailsByIssue$
      .subscribe(details => this.nonLuesParTache = details);
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
  }

  nonLues(issue: Issue): number {
    return this.detailsNonLues(issue).length;
  }

  resumeNonLues(issue: Issue): string {
    return this.notificationService.resumeTexte(this.detailsNonLues(issue), 'Nouveautés :');
  }

  private detailsNonLues(issue: Issue): NotificationApp[] {
    if (issue?.id == null) {
      return IssueBoardComponent.AUCUNE;
    }
    return this.nonLuesParTache.get(Number(issue.id)) ?? IssueBoardComponent.AUCUNE;
  }

  /** statuts du workflow, dans l'ordre des colonnes */
  @Input() statuses: Status[] = [];
  @Input() issues: Issue[] = [];
  @Input() emptyLabel = 'Aucune tâche';
  /** `master` : titre appuyé et nombre de sous-tâches ; `subtask` : rappel de
   *  la demande parente ; `auto` : l'un ou l'autre selon la tâche, pour un
   *  board qui mêle les deux. `default` garde la carte d'origine. */
  @Input() variant: 'default' | 'master' | 'subtask' | 'auto' = 'default';

  isMasterCard(issue: Issue): boolean {
    if (this.variant !== 'auto') {
      return this.variant === 'master';
    }
    const level = issue?.issueType?.level;
    return level ? level === 'PARENT' : !issue?.parent;
  }

  isSubtaskCard(issue: Issue): boolean {
    return this.variant === 'subtask' || (this.variant === 'auto' && !this.isMasterCard(issue));
  }
  @Output() issueClick = new EventEmitter<Issue>();
  @Output() statusDrop = new EventEmitter<IssueStatusDrop>();
  /** une carte a été modifiée sur place (assignation) */
  @Output() issueUpdated = new EventEmitter<Issue>();

  columns: Status[] = [];
  draggedIssue: Issue | null = null;
  dragOverStatusId: number | null = null;
  private issuesByStatusId = new Map<number, Issue[]>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['statuses'] || changes['issues']) {
      this.columns = resolveStatuses(this.statuses, this.issues);
      this.issuesByStatusId = groupByStatus(this.issues);
    }
  }

  issuesFor(status: Status): Issue[] {
    return this.issuesByStatusId.get(status.id) ?? [];
  }

  trackByStatus(_index: number, status: Status): number {
    return status.id;
  }

  trackByIssue(_index: number, issue: Issue): number | string {
    return issue.id ?? String(issue.issueKey);
  }

  onDragStart(event: DragEvent, issue: Issue): void {
    this.draggedIssue = issue;
    // Sans setData, Firefox refuse de démarrer le glissement.
    event.dataTransfer?.setData('text/plain', String(issue.id ?? ''));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragEnd(): void {
    this.draggedIssue = null;
    this.dragOverStatusId = null;
  }

  onDragOver(event: DragEvent, status: Status): void {
    if (this.draggedIssue == null) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverStatusId = status.id;
  }

  onDragLeave(status: Status): void {
    if (this.dragOverStatusId === status.id) {
      this.dragOverStatusId = null;
    }
  }

  onDrop(event: DragEvent, status: Status): void {
    event.preventDefault();
    const issue = this.draggedIssue;
    this.onDragEnd();
    if (issue == null || issue.status?.id === status.id) return;
    this.statusDrop.emit({issue, status});
  }
}
