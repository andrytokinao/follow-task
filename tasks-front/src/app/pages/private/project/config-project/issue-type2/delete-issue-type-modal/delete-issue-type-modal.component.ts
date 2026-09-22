import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../../services/issue.service";
import {Issue, IssueType} from "../../../../../../type/issue";

/**
 * Popup de suppression d'un type de tache : les taches qui l'utilisent
 * doivent d'abord recevoir un autre type, choisi tache par tache ou pour
 * une selection de taches.
 */
@Component({
  selector: 'app-delete-issue-type-modal',
  standalone: false,
  templateUrl: './delete-issue-type-modal.component.html',
  styleUrls: ['./delete-issue-type-modal.component.css']
})
export class DeleteIssueTypeModalComponent implements OnInit {

  /** Type a supprimer. */
  @Input() issueType!: IssueType;
  /** Arborescence des types du projet (parents et leurs sous-types). */
  @Input() issueTypes: IssueType[] = [];

  issues: Issue[] = [];
  candidates: IssueType[] = [];
  /** Nouveau type choisi par tache : issueId -> issueTypeId. */
  targets: { [issueId: number]: number | null } = {};
  selected = new Set<number>();
  bulkTarget: number | null = null;
  search: string = '';

  loading: boolean = true;
  saving: boolean = false;
  errorMessage: string = '';

  constructor(public activeModal: NgbActiveModal,
              private issueService: IssueService) {
  }

  ngOnInit(): void {
    this.candidates = this.buildCandidates();
    const single = this.candidates.length == 1 ? this.candidates[0].id! : null;
    this.issueService.issuesByIssueType(this.issueType.id!).subscribe({
      next: issues => {
        this.issues = issues;
        issues.forEach(issue => this.targets[issue.id!] = single);
        this.loading = false;
      },
      error: error => {
        this.errorMessage = this.extractMessage(error);
        this.loading = false;
      }
    });
  }

  /** Types de meme niveau que le type supprime, sans doublon ni le type lui-meme. */
  private buildCandidates(): IssueType[] {
    const byId = new Map<number, IssueType>();
    this.issueTypes.forEach(parent => {
      [parent, ...(parent.children || [])].forEach(type => {
        if (type.id != null && !byId.has(type.id)) {
          byId.set(type.id, type);
        }
      });
    });
    const level = this.issueType.level || 'PARENT';
    return Array.from(byId.values())
      .filter(type => type.id != this.issueType.id && (type.level || 'PARENT') == level)
      .sort((a, b) => ('' + a.name).localeCompare('' + b.name));
  }

  // -----------------------------------------------------------------
  // Selection
  // -----------------------------------------------------------------

  get filteredIssues(): Issue[] {
    const term = (this.search || '').toLowerCase().trim();
    if (!term) {
      return this.issues;
    }
    return this.issues.filter(issue =>
      ('' + (issue.issueKey || '')).toLowerCase().includes(term)
      || ('' + (issue.summary || '')).toLowerCase().includes(term));
  }

  isSelected(issue: Issue): boolean {
    return this.selected.has(issue.id!);
  }

  toggle(issue: Issue) {
    if (this.selected.has(issue.id!)) {
      this.selected.delete(issue.id!);
    } else {
      this.selected.add(issue.id!);
    }
  }

  get allSelected(): boolean {
    const visible = this.filteredIssues;
    return visible.length > 0 && visible.every(issue => this.selected.has(issue.id!));
  }

  toggleAll() {
    const select = !this.allSelected;
    this.filteredIssues.forEach(issue => select
      ? this.selected.add(issue.id!)
      : this.selected.delete(issue.id!));
  }

  /** Applique le type choisi a toutes les taches cochees. */
  applyToSelection() {
    if (this.bulkTarget == null) {
      return;
    }
    this.selected.forEach(issueId => this.targets[issueId] = this.bulkTarget);
    this.selected.clear();
  }

  // -----------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------

  get remainingCount(): number {
    return this.issues.filter(issue => this.targets[issue.id!] == null).length;
  }

  get canConfirm(): boolean {
    return !this.loading && !this.saving && this.remainingCount == 0
      && (this.issues.length == 0 || this.candidates.length > 0);
  }

  confirm() {
    if (!this.canConfirm) {
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    const reassignments = this.issues.map(issue => ({
      issueId: issue.id!,
      issueTypeId: this.targets[issue.id!]!
    }));
    this.issueService.reassignIssuesAndDeleteIssueType(this.issueType.id!, reassignments).subscribe({
      next: response => {
        this.saving = false;
        this.activeModal.close(response);
      },
      error: error => {
        this.saving = false;
        this.errorMessage = this.extractMessage(error);
      }
    });
  }

  dismiss() {
    this.activeModal.dismiss();
  }

  // -----------------------------------------------------------------
  // Affichage
  // -----------------------------------------------------------------

  /** Sous-types propres au type supprime (hors « Tâche » par defaut) : ils bloquent la suppression. */
  get blockingChildren(): IssueType[] {
    return (this.issueType.children || [])
      .filter(child => child.name !== 'Tâche' && (child.parents || []).length <= 1);
  }

  get blockingNames(): string {
    return this.blockingChildren.map(child => child.name).join(', ');
  }

  parentNames(issueType: IssueType): string {
    return (issueType?.parents || []).map(parent => parent.name).join(', ');
  }

  trackByIssue(index: number, issue: Issue): number | undefined {
    return issue.id;
  }

  private extractMessage(error: any): string {
    const graphQlMessage = error?.graphQLErrors?.length ? error.graphQLErrors[0].message : null;
    return graphQlMessage || error?.message || "L'opération a échoué.";
  }
}
