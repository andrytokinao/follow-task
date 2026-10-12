import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Issue, User} from "../../type/issue";
import {UserService} from "../../services/user.service";
import {AssigneeCount, countAssignees, UNASSIGNED_ID, userDisplayName} from "../../type/issue-grouping.util";

/**
 * Rangée d'avatars des assignés d'une liste d'issues, avec leur nombre de
 * tâches : un clic ajoute ou retire la personne de la sélection. Le
 * composant ne filtre rien lui-même — il expose la sélection, que le parent
 * applique avec `filterByAssignees`.
 */
@Component({
  standalone: false,
  selector: 'app-assignee-filter',
  templateUrl: './assignee-filter.component.html',
  styleUrl: './assignee-filter.component.css'
})
export class AssigneeFilterComponent implements OnChanges {
  @Input() issues: Issue[] = [];
  /** identifiants retenus ; `UNASSIGNED_ID` pour les issues sans assigné */
  @Input() selectedIds: string[] = [];
  @Output() selectedIdsChange = new EventEmitter<string[]>();
  /**
   * Personnes à proposer même sans tâche dans `issues` (les membres d'un espace
   * de travail, par exemple) : elles suivent les assignés, avec un compte nul.
   * Vide par défaut : seuls les assignés sont alors proposés.
   */
  @Input() users: User[] = [];

  readonly UNASSIGNED_ID = UNASSIGNED_ID;
  assignees: AssigneeCount[] = [];
  unassigned = 0;

  constructor(private userService: UserService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['issues'] || changes['users']) {
      const counts = countAssignees(this.issues);
      const sansTache = (this.users || [])
        .filter(user => user?.id && !counts.assignees.some(entry => entry.user.id == user.id))
        .map(user => ({user, count: 0}));
      this.assignees = [...counts.assignees, ...sansTache];
      this.unassigned = counts.unassigned;
    }
  }

  get hasSelection(): boolean {
    return (this.selectedIds || []).length > 0;
  }

  isSelected(id: string): boolean {
    return (this.selectedIds || []).includes(id);
  }

  toggle(id: string): void {
    const ids = this.isSelected(id)
      ? this.selectedIds.filter(selected => selected != id)
      : [...(this.selectedIds || []), id];
    this.emit(ids);
  }

  clear(): void {
    this.emit([]);
  }

  displayName(user: User): string {
    return userDisplayName(user);
  }

  /** null sans photo : app-avatar génère alors des initiales colorées. */
  photoUrl(user: User): string | null {
    return user && user.photo ? this.userService.getUrlPhoto(user) : null;
  }

  trackByAssignee(_index: number, entry: AssigneeCount): string {
    return entry.user.id;
  }

  private emit(ids: string[]): void {
    this.selectedIds = ids;
    this.selectedIdsChange.emit(ids);
  }
}
