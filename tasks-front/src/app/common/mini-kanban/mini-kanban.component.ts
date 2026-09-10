import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Issue, Status, User } from '../../type/issue';
import { UserService } from '../../services/user.service';
import { IconeViewComponent } from '../icone-view/icone-view.component';

export interface MiniKanbanStatusChange {
  issue: Issue;
  fromStatus: Status | null;
  toStatus: Status;
}

/**
 * Tableau kanban compact et réutilisable : une colonne par statut, cartes
 * cliquables + glisser-déposer optionnel pour changer de statut.
 * Inspiré de IssueBoaardComponent, mais sans dépendance à un projet ou un
 * workflow complet : statuts et issues sont fournis par le parent, ce qui
 * permet de l'utiliser aussi bien pour un board principal que pour une
 * sous-liste (ex: sous-tâches d'une issue).
 */
@Component({
  selector: 'app-mini-kanban',
  standalone: true,
  imports: [CommonModule, IconeViewComponent],
  templateUrl: './mini-kanban.component.html',
  styleUrl: './mini-kanban.component.scss'
})
export class MiniKanbanComponent implements OnChanges {

  @Input() issues: Issue[] = [];
  @Input() statuses: Status[] = [];
  @Input() selectedIssueId: number | string | null = null;
  @Input() enableDragDrop = true;
  @Input() emptyLabel = 'Aucune tâche';

  @Output() issueSelected = new EventEmitter<Issue>();
  @Output() statusChanged = new EventEmitter<MiniKanbanStatusChange>();

  dragOverStatusId: number | null = null;
  private draggedIssue: Issue | null = null;

  constructor(private userService: UserService) {}

  /**
   * Regroupement calculé une fois par changement d'entrée. Le gabarit appelle
   * `issuesFor(status)` deux fois par colonne (cartes + compteur) : le faire
   * filtrer à chaque cycle de détection reparcourait tout le tableau.
   *
   * Le parent doit donc fournir un NOUVEAU tableau quand une carte change de
   * statut (mutation en place du tableau existant : pas de `ngOnChanges`, donc
   * pas de regroupement).
   */
  private issuesByStatusId = new Map<number, Issue[]>();

  ngOnChanges(): void {
    const grouped = new Map<number, Issue[]>();
    for (const issue of this.issues ?? []) {
      const statusId = issue.status?.id;
      if (statusId == null) continue;
      const bucket = grouped.get(statusId);
      if (bucket) bucket.push(issue);
      else grouped.set(statusId, [issue]);
    }
    this.issuesByStatusId = grouped;
  }

  issuesFor(status: Status): Issue[] {
    return this.issuesByStatusId.get(status?.id) ?? [];
  }

  trackByStatus(_index: number, status: Status): number {
    return status.id;
  }

  trackByIssue(_index: number, issue: Issue): number | string {
    return issue.id ?? String(issue.issueKey);
  }

  getUrlPhoto(user: User): string {
    return this.userService.getUrlPhoto(user);
  }

  isDragging(issue: Issue): boolean {
    return this.draggedIssue?.id === issue.id;
  }

  selectIssue(issue: Issue): void {
    this.issueSelected.emit(issue);
  }

  onDragStart(event: DragEvent, issue: Issue): void {
    if (!this.enableDragDrop) return;
    this.draggedIssue = issue;
    // Sans effectAllowed/setData, Firefox refuse de démarrer le glissement.
    event.dataTransfer?.setData('text/plain', String(issue.id ?? ''));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragEnd(): void {
    this.draggedIssue = null;
    this.dragOverStatusId = null;
  }

  onDragOver(event: DragEvent, status: Status): void {
    if (!this.enableDragDrop) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverStatusId = status.id;
  }

  onDragLeave(status: Status): void {
    if (this.dragOverStatusId === status.id) this.dragOverStatusId = null;
  }

  onDrop(event: DragEvent, status: Status): void {
    if (!this.enableDragDrop) return;
    event.preventDefault();
    this.dragOverStatusId = null;

    const issue = this.draggedIssue;
    this.draggedIssue = null;
    if (!issue) return;

    const fromStatus = issue.status ?? null;
    if (fromStatus?.id === status.id) return;

    // Le composant ne modifie pas l'issue lui-même : c'est au parent de
    // décider (appel API, mise à jour optimiste, rollback en cas d'erreur).
    this.statusChanged.emit({ issue, fromStatus, toStatus: status });
  }
}
