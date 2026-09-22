import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Issue, IssueType} from "../../type/issue";
import {IssueService} from "../../services/issue.service";

/**
 * Popup de changement de type d'une tache.
 *
 * <p>Les types proposes viennent du serveur : une tache principale ne voit que
 * les types principaux du projet, une sous-tache ne voit que les sous-types
 * declares sous le type de sa tache parente.</p>
 *
 * <p>« Changer la clé » demande la clé suivante du type choisi et l'affiche
 * avant l'enregistrement ; le dossier de la tache suit la nouvelle clé quand
 * c'est possible.</p>
 */
@Component({
  standalone: false,
  selector: 'app-change-issue-type',
  templateUrl: './change-issue-type.component.html',
  styleUrl: './change-issue-type.component.css'
})
export class ChangeIssueTypeComponent implements OnInit {

  /** Tache dont le type change. */
  @Input() issue!: Issue;

  candidates: IssueType[] = [];
  /** Type choisi dans le formulaire. */
  targetId: number | null = null;
  /** La tache prend aussi la clé suivante du nouveau type (TACHE-03 -> DATA-102). */
  renameKey = false;
  /** Apercu de la nouvelle clé, demandé au serveur. */
  previewKey = '';
  loadingPreview = false;

  loading = true;
  saving = false;
  errorMessage = '';

  constructor(public activeModal: NgbActiveModal,
              private issueService: IssueService) {
  }

  ngOnInit(): void {
    this.targetId = this.issue?.issueType?.id ?? null;
    this.issueService.changeableIssueTypes(this.issue.id!).subscribe({
      next: types => {
        this.candidates = types || [];
        this.loading = false;
      },
      error: error => {
        this.errorMessage = this.extractMessage(error);
        this.loading = false;
      }
    });
  }

  /** Une sous-tache ne choisit que parmi les sous-types de sa tache parente. */
  get isSubtask(): boolean {
    return !!this.issue?.parent;
  }

  /**
   * Projet dans lequel la cle est calculee. La tache ouverte ne porte pas
   * toujours son projet ; les types proposes, eux, viennent tous du bon projet.
   */
  private get projectId(): number | null {
    const fromIssue = this.issue?.project?.id;
    if (fromIssue != null) {
      return Number(fromIssue);
    }
    const fromType = this.candidates.find(type => type.id == this.targetId)?.project?.id;
    return fromType == null ? null : Number(fromType);
  }

  get currentTypeName(): string {
    return '' + (this.issue?.issueType?.name || '—');
  }

  get changed(): boolean {
    return this.targetId != null
      && (this.targetId != this.issue?.issueType?.id || this.renameKey);
  }

  get canConfirm(): boolean {
    return !this.loading && !this.saving && this.changed
      && !(this.renameKey && this.loadingPreview);
  }

  onTargetChange() {
    if (this.renameKey) {
      this.loadPreviewKey();
    }
  }

  toggleRename() {
    this.renameKey = !this.renameKey;
    if (this.renameKey) {
      this.loadPreviewKey();
    } else {
      this.previewKey = '';
    }
  }

  /**
   * Demande au serveur la clé que la tache porterait avec le type choisi :
   * la meme requete qu'a la creation d'une tache, il n'y a pas d'autre calcul.
   */
  private loadPreviewKey() {
    const projectId = this.projectId;
    if (this.targetId == null || projectId == null) {
      this.previewKey = '';
      return;
    }
    this.loadingPreview = true;
    this.issueService.getNextKeyParent(this.targetId, projectId).subscribe({
      next: key => {
        this.previewKey = '' + (key || '');
        this.loadingPreview = false;
      },
      error: () => {
        this.previewKey = '';
        this.loadingPreview = false;
      }
    });
  }

  confirm() {
    if (!this.canConfirm) {
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.issueService.changeIssueType(this.issue.id!, this.targetId!, this.renameKey).subscribe({
      next: issue => {
        this.saving = false;
        this.activeModal.close(issue);
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

  trackByType(index: number, type: IssueType): number | undefined {
    return type.id;
  }

  private extractMessage(error: any): string {
    const graphQlMessage = error?.graphQLErrors?.length ? error.graphQLErrors[0].message : null;
    return graphQlMessage || error?.message || "L'opération a échoué.";
  }
}
