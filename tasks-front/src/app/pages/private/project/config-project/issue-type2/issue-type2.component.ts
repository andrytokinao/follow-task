import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Subscription} from "rxjs";
import {IssueTypeModalComponent} from "../issue-type/issue-type-modal/issue-type-modal.component";
import {IssueService} from "../../../../../services/issue.service";
import {ConfirmationDialogService} from "../../../../../services/confirmation-dialog.service";
import {IssueType, Project} from "../../../../../type/issue";

type FormMode = 'idle' | 'create' | 'edit';

@Component({
  selector: 'app-issue-type2',
  standalone: false,
  templateUrl: './issue-type2.component.html',
  styleUrls: ['./issue-type2.component.css']
})
export class IssueType2Component implements OnInit, OnDestroy {

  issueTypes: IssueType[] = [];
  selectedIssue: IssueType | null = null;
  project: Project | undefined;
  search: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  // ---- panneau de formulaire ----
  formMode: FormMode = 'idle';
  formLevel: 'PARENT' | 'SUB_TASK' = 'PARENT';
  formParents: IssueType[] = [];
  editingType: IssueType | null = null;

  // ---- glisser-deposer ----
  draggedItem?: IssueType;
  draggedFromParent?: IssueType;
  dropTarget?: IssueType;

  private subscriptions: Subscription[] = [];

  constructor(
    private modalService: NgbModal,
    private issueService: IssueService,
    private confirmationDialog: ConfirmationDialogService
  ) {
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.issueService.project$.subscribe(project => {
        const changed = project?.id != this.project?.id;
        this.project = project;
        // le projet n'est connu qu'apres emission : on charge des qu'il arrive
        if (changed) {
          this.reload();
        }
      }),
      this.issueService.issueType$.subscribe(issueTypes => {
        this.issueTypes = issueTypes || [];
        this.loading = false;
        this.refreshSelection();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  reload() {
    if (!this.project?.id) {
      return;
    }
    this.loading = true;
    this.issueService.allIssueType(this.project.id);
  }

  /** Garde la selection courante synchronisee avec la liste rechargee. */
  private refreshSelection() {
    if (!this.selectedIssue) {
      return;
    }
    const found = this.findById(this.selectedIssue.id);
    this.selectedIssue = found || null;
    if (this.formMode == 'edit') {
      this.editingType = this.selectedIssue;
      if (!this.editingType) {
        this.closeForm();
      }
    }
  }

  private findById(id: number | undefined): IssueType | null {
    if (id == null) {
      return null;
    }
    for (const parent of this.issueTypes) {
      if (parent.id == id) {
        return parent;
      }
      const child = (parent.children || []).find(item => item.id == id);
      if (child) {
        return child;
      }
    }
    return null;
  }

  // -----------------------------------------------------------------
  // Recherche
  // -----------------------------------------------------------------

  get filteredTypes(): IssueType[] {
    const term = (this.search || '').toLowerCase().trim();
    if (!term) {
      return this.issueTypes;
    }
    return this.issueTypes
      .map(parent => {
        if (this.matches(parent, term)) {
          return parent;
        }
        const children = (parent.children || []).filter(child => this.matches(child, term));
        return children.length ? {...parent, children} : null;
      })
      .filter(parent => parent != null) as IssueType[];
  }

  private matches(issueType: IssueType, term: string): boolean {
    return ('' + (issueType.name || '')).toLowerCase().includes(term)
      || ('' + (issueType.prefix || '')).toLowerCase().includes(term);
  }

  /** Un sous-type partage entre plusieurs parents n'est compte qu'une fois. */
  get totalCount(): number {
    const ids = new Set<number | undefined>();
    this.issueTypes.forEach(parent => {
      ids.add(parent.id);
      (parent.children || []).forEach(child => ids.add(child.id));
    });
    return ids.size;
  }

  // -----------------------------------------------------------------
  // Selection et formulaire
  // -----------------------------------------------------------------

  select(issueType: IssueType) {
    this.selectedIssue = issueType;
    if (this.formMode == 'edit') {
      this.startEdit(issueType);
    }
  }

  startCreateParent() {
    this.errorMessage = '';
    this.formMode = 'create';
    this.formLevel = 'PARENT';
    this.formParents = [];
    this.editingType = null;
  }

  startCreateSubTask(parent: IssueType) {
    this.errorMessage = '';
    this.selectedIssue = parent;
    this.formMode = 'create';
    this.formLevel = 'SUB_TASK';
    this.formParents = [parent];
    this.editingType = null;
  }

  startEdit(issueType: IssueType) {
    this.errorMessage = '';
    this.selectedIssue = issueType;
    this.formMode = 'edit';
    this.formLevel = (issueType.level as 'PARENT' | 'SUB_TASK') || 'PARENT';
    this.formParents = [...(issueType.parents || [])];
    this.editingType = issueType;
  }

  closeForm() {
    this.formMode = 'idle';
    this.editingType = null;
    this.formParents = [];
    this.formLevel = 'PARENT';
  }

  onSaved(savedIssueType: IssueType) {
    this.selectedIssue = savedIssueType;
    this.closeForm();
    this.reload();
  }

  // -----------------------------------------------------------------
  // Suppression
  // -----------------------------------------------------------------

  remove(issueType: IssueType, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (issueType.id == null) {
      return;
    }
    // le sous-type par defaut « Tâche » est supprime avec son parent cote serveur
    const childCount = (issueType.children || []).filter(child => child.name !== 'Tâche').length;
    const warning = childCount
      ? ` Ce type possède ${childCount} sous-type(s) qu'il faudra détacher au préalable.`
      : '';
    this.confirmationDialog.confirm(
      'Supprimer le type',
      `Supprimer définitivement « ${issueType.name} » ?${warning}`,
      'Supprimer',
      'Annuler'
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.errorMessage = '';
      this.issueService.deleteIssueType(issueType.id).subscribe({
        next: () => {
          if (this.selectedIssue?.id == issueType.id) {
            this.selectedIssue = null;
            this.closeForm();
          }
          this.reload();
        },
        error: (error) => this.errorMessage = this.extractMessage(error)
      });
    }).catch(() => {
    });
  }

  // -----------------------------------------------------------------
  // Hierarchie : rattachement / detachement
  // -----------------------------------------------------------------

  /** Detache un sous-type de ce parent uniquement ; ses autres parents sont conserves. */
  detach(child: IssueType, parent: IssueType, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (child.id == null || parent.id == null) {
      return;
    }
    this.errorMessage = '';
    this.issueService.removeIssueTypeParent(child.id, parent.id).subscribe({
      next: () => this.reload(),
      error: (error) => this.errorMessage = this.extractMessage(error)
    });
  }

  private attachTo(child: IssueType, parent: IssueType) {
    if (child.id == null || parent.id == null || child.id == parent.id) {
      return;
    }
    // un type ne peut pas devenir le sous-type d'un de ses propres enfants
    if ((child.children || []).some(item => item.id == parent.id)) {
      this.errorMessage = "Impossible : « " + parent.name + " » est déjà un sous-type de « " + child.name + " ».";
      return;
    }
    this.errorMessage = '';
    this.issueService.affectIssueTypeForParent(child.id, parent.id).subscribe({
      next: () => this.reload(),
      error: (error) => this.errorMessage = this.extractMessage(error)
    });
  }

  dragStart(issueType: IssueType, parent?: IssueType) {
    this.draggedItem = issueType;
    this.draggedFromParent = parent;
  }

  dragEnd() {
    this.draggedItem = undefined;
    this.draggedFromParent = undefined;
    this.dropTarget = undefined;
  }

  dragOver(event: DragEvent, parent: IssueType) {
    if (!this.draggedItem || this.draggedItem.id == parent.id) {
      return;
    }
    event.preventDefault();
    this.dropTarget = parent;
  }

  dragLeave(parent: IssueType) {
    if (this.dropTarget?.id == parent.id) {
      this.dropTarget = undefined;
    }
  }

  dropOnParent(event: DragEvent, newParent: IssueType) {
    event.preventDefault();
    const dragged = this.draggedItem;
    this.dragEnd();
    if (!dragged || dragged.id == newParent.id) {
      return;
    }
    if (this.draggedFromParent?.id == newParent.id
      || (newParent.children || []).some(child => child.id == dragged.id)) {
      return;
    }
    // Relation plusieurs-a-plusieurs : le sous-type est ajoute au nouveau parent
    // sans etre retire des autres (utiliser « Détacher » pour le retirer).
    this.attachTo(dragged, newParent);
  }

  isDropTarget(parent: IssueType): boolean {
    return this.dropTarget?.id == parent.id;
  }

  // -----------------------------------------------------------------
  // Divers
  // -----------------------------------------------------------------

  showConfigType(issueType: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const dialogRef = this.modalService.open(IssueTypeModalComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.issueType = issueType;
    dialogRef.componentInstance.project = this.project;
    dialogRef.result.then((res) => {
      if (res) {
        this.selectedIssue = res;
      }
      this.reload();
    }, () => {
    });
  }

  trackByType(index: number, issueType: IssueType): number | undefined {
    return issueType.id;
  }

  describe(issueType: IssueType): string {
    return '' + (issueType?.description || '');
  }

  colorOf(issueType: IssueType, fallback: string): string {
    return '' + (issueType?.color || fallback);
  }

  iconOf(issueType: IssueType, fallback: string): string {
    return '' + (issueType?.icone?.value || fallback);
  }

  childCount(issueType: IssueType): number {
    return (issueType?.children || []).length;
  }

  parentNames(issueType: IssueType): string {
    return (issueType?.parents || []).map(parent => parent.name).join(', ');
  }

  /** Nombre d'autres parents du sous-type, affiche comme badge « partage ». */
  otherParentCount(child: IssueType): number {
    return Math.max(0, (child?.parents || []).length - 1);
  }

  private extractMessage(error: any): string {
    const graphQlMessage = error?.graphQLErrors?.length ? error.graphQLErrors[0].message : null;
    return graphQlMessage || error?.message || "L'opération a échoué.";
  }
}
