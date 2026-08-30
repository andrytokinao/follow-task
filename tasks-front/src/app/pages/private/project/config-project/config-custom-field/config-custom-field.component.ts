import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {NgClass, NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {Subscription} from "rxjs";
import {CustomField, IssueType, Project, UsingCustomField} from "../../../../../type/issue";
import {IssueService} from "../../../../../services/issue.service";
import {ConfirmationDialogService} from "../../../../../services/confirmation-dialog.service";
import {MyCommonModule} from "../../../../../common/common.module";
import {CustomFieldComponent} from "../../../../../common/custom-field/custom-field.component";
import {CustomFieldStepperComponent} from "./custom-field-stepper/custom-field-stepper.component";
import {IconeViewComponent} from "../../../../../common/icone-view/icone-view.component";

@Component({
  selector: 'config-app-custom-field',
  templateUrl: './config-custom-field.component.html',
  styleUrl: './config-custom-field.component.css',
  standalone: true,
  imports: [MyCommonModule, NgForOf, NgIf, NgClass, FormsModule, IconeViewComponent],
})
export class ConfigCustomFieldComponent implements OnInit, OnDestroy {

  project: Project | any = {};
  customFields: CustomField[] = [];
  issueTypes: IssueType[] = [];
  selected: CustomField | null = null;
  search: string = '';
  errorMessage: string = '';
  saving: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(private modalService: NgbModal,
              private issueService: IssueService,
              private confirmationDialog: ConfirmationDialogService) {
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.issueService.allCustomField$.subscribe(customFields => {
        this.customFields = customFields || [];
        this.refreshSelection();
      }),
      this.issueService.issueType$.subscribe(issueTypes => this.issueTypes = issueTypes || []),
      this.issueService.project$.subscribe(project => this.project = project)
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private refreshSelection() {
    if (!this.selected) {
      return;
    }
    this.selected = this.customFields.find(field => field.id == this.selected!.id) || null;
  }

  // -----------------------------------------------------------------
  // Liste
  // -----------------------------------------------------------------

  get filteredFields(): CustomField[] {
    const term = (this.search || '').toLowerCase().trim();
    if (!term) {
      return this.customFields;
    }
    return this.customFields.filter(field =>
      ('' + (field.name || '')).toLowerCase().includes(term) ||
      ('' + (field.type || '')).toLowerCase().includes(term));
  }

  select(field: CustomField) {
    this.errorMessage = '';
    this.selected = this.selected?.id == field.id ? null : field;
  }

  isSelected(field: CustomField): boolean {
    return this.selected?.id == field.id;
  }

  getIcone(field: CustomField) {
    return CustomFieldComponent.getIcone(field);
  }

  typeLabel(field: CustomField): string {
    const labels: { [key: string]: string } = {
      String: 'Texte',
      Date: 'Date',
      Number: 'Nombre',
      User: 'Utilisateur',
      Selection: 'Liste de choix',
      CheckBox: 'Case à cocher',
      Link: 'Lien',
      Issue: 'Tâche'
    };
    return labels['' + field?.type] || ('' + (field?.type || '—'));
  }

  optionsOf(field: CustomField): String[] {
    return field?.options || [];
  }

  /** Types de tache auxquels le champ est affecte. */
  usedBy(field: CustomField): UsingCustomField[] {
    return (field?.issueTypes || []).filter(using => using?.issueType != null);
  }

  usageCount(field: CustomField): number {
    return this.usedBy(field).length;
  }

  /** Tous les types du projet, parents et sous-types confondus. */
  get flatIssueTypes(): IssueType[] {
    const flat: IssueType[] = [];
    this.issueTypes.forEach(parent => {
      flat.push(parent);
      (parent.children || []).forEach(child => flat.push(child));
    });
    return flat;
  }

  isUsedByType(field: CustomField, issueType: IssueType): boolean {
    return this.usedBy(field).some(using => using.issueType?.id == issueType.id);
  }

  // -----------------------------------------------------------------
  // Affectation aux types de tache
  // -----------------------------------------------------------------

  toggleIssueType(issueType: IssueType, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!this.selected || this.selected.id == null || issueType.id == null || this.saving) {
      return;
    }
    const payload: any = {
      customField: {id: this.selected.id},
      issueType: {id: issueType.id}
    };
    const used = this.isUsedByType(this.selected, issueType);
    const call = used
      ? this.issueService.unUseCustomField(payload)
      : this.issueService.useCustomField(payload);

    this.errorMessage = '';
    this.saving = true;
    call.subscribe({
      next: () => {
        this.saving = false;
        // la mutation renvoie les affectations du type ; on recharge les champs
        // pour que la colonne de gauche reste juste.
        this.issueService.loadAllCustomField();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = this.extractMessage(error);
      }
    });
  }

  // -----------------------------------------------------------------
  // Creation / edition / suppression
  // -----------------------------------------------------------------

  newCustomField() {
    const dialogRef = this.modalService.open(CustomFieldStepperComponent);
    dialogRef.componentInstance.project = this.project;
    dialogRef.componentInstance.allIssueTypes = this.flatIssueTypes;
    dialogRef.result.then(() => this.issueService.loadAllCustomField(), () => {
    });
  }

  editCustomField(field: CustomField, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const dialogRef = this.modalService.open(CustomFieldStepperComponent);
    dialogRef.componentInstance.allIssueTypes = this.flatIssueTypes;
    dialogRef.componentInstance.getCustomField(field.id);
    dialogRef.componentInstance.desabledTypeField();
    dialogRef.result.then(() => this.issueService.loadAllCustomField(), () => {
    });
  }

  deleteCustomField(field: CustomField, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (field?.id == null) {
      return;
    }
    const usage = this.usageCount(field);
    const warning = usage ? ` Il est affecté à ${usage} type(s) de tâche.` : '';
    this.confirmationDialog.confirm(
      'Supprimer le champ',
      `Supprimer définitivement « ${field.name} » ?${warning}`,
      'Supprimer', 'Annuler'
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.errorMessage = '';
      this.issueService.deleteCustomField(<number>field.id).subscribe({
        next: () => {
          if (this.selected?.id == field.id) {
            this.selected = null;
          }
          this.issueService.loadAllCustomField();
        },
        error: (error) => this.errorMessage = this.extractMessage(error)
      });
    }).catch(() => {
    });
  }

  trackByField(index: number, field: CustomField): number {
    return field.id;
  }

  trackByType(index: number, issueType: IssueType): number | undefined {
    return issueType.id;
  }

  private extractMessage(error: any): string {
    const graphQlMessage = error?.graphQLErrors?.length ? error.graphQLErrors[0].message : null;
    return graphQlMessage || error?.message || "L'opération a échoué.";
  }
}
