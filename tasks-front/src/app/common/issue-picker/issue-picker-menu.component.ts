import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { Issue } from '../../type/issue';

// Arborescence d'issues affichée dans un seul mat-menu : dépliage inline
// (comme un sous-dossier), sélection multiple par case à cocher sur
// chaque ligne (parent ou enfant), et un pied de menu avec les actions
// "Créer" (lier les issues cochées) et "Créer une nouvelle sous-issue".
@Component({
  selector: 'app-issue-picker-menu',
  standalone: true,
  imports: [CommonModule, MatMenuModule],
  templateUrl: './issue-picker-menu.component.html',
  styleUrls: ['./issue-picker-menu.component.scss'],
})
export class IssuePickerMenuComponent {
  @Input() issues: Issue[] = [];

  // Émis quand l'utilisateur valide via "Créer" : toutes les issues cochées,
  // parents et enfants confondus.
  @Output() issuesSelected = new EventEmitter<Issue[]>();

  // Émis quand l'utilisateur clique "Créer une nouvelle sous-issue".
  // Si une seule issue est cochée au moment du clic, elle est passée comme
  // parent pressenti ; sinon `null` (le consommateur devra la demander).
  @Output() createSubIssueRequested = new EventEmitter<Issue | null>();

  @ViewChild('menu', { static: true }) menu!: MatMenu;

  private expandedKeys = new Set<string>();
  private selectedByKey = new Map<string, Issue>();

  hasChildren(issue: Issue): boolean {
    return !!(issue as any).children?.length;
  }

  private keyOf(issue: Issue): string {
    return String((issue as any).id ?? issue.issueKey);
  }

  isExpanded(issue: Issue): boolean {
    return this.expandedKeys.has(this.keyOf(issue));
  }

  isSelected(issue: Issue): boolean {
    return this.selectedByKey.has(this.keyOf(issue));
  }

  get selectionCount(): number {
    return this.selectedByKey.size;
  }

  // Déplie/replie sans toucher à la sélection ni fermer le menu.
  toggleExpand(issue: Issue, event: Event): void {
    event.stopPropagation();
    const key = this.keyOf(issue);
    if (this.expandedKeys.has(key)) {
      this.expandedKeys.delete(key);
    } else {
      this.expandedKeys.add(key);
    }
  }

  // Coche/décoche la ligne. Reste indépendant du dépliage : une issue
  // repliée avec des enfants peut quand même être sélectionnée elle-même.
  toggleSelect(issue: Issue, event: Event): void {
    event.stopPropagation();
    const key = this.keyOf(issue);
    if (this.selectedByKey.has(key)) {
      this.selectedByKey.delete(key);
    } else {
      this.selectedByKey.set(key, issue);
    }
  }

  onCreateClick(): void {
    if (this.selectedByKey.size === 0) return;
    this.issuesSelected.emit(Array.from(this.selectedByKey.values()));
    this.selectedByKey.clear();
  }

  onCreateSubIssueClick(): void {
    const selected = Array.from(this.selectedByKey.values());
    this.createSubIssueRequested.emit(selected.length === 1 ? selected[0] : null);
  }

  progressClass(percent: number | null | undefined): string {
    const p = percent ?? 0;
    if (p >= 70) return 'progress-high';
    if (p >= 30) return 'progress-mid';
    return 'progress-low';
  }
}
