import {
  Component,
  EventEmitter,
  Input,
  Output, ViewChild
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatInput, MatInputModule } from '@angular/material/input';
import {MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import { TextFieldModule } from '@angular/cdk/text-field';
import { NgxColorsModule } from 'ngx-colors';
import { IssueType, Project, Icone } from '../../type/issue';
import { IssueService } from '../../services/issue.service';
import { ChooseDialogComponent } from '../icone-field/choose-dialog/choose-dialog.component';
import {IconeViewComponent} from "../icone-view/icone-view.component";

@Component({
  selector: 'app-issutype-form2',
  standalone: true,
  imports: [
    MatFormField,
    MatIcon,
    MatButton,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatInput,
    TextFieldModule,
    NgxColorsModule,
    CommonModule,
    ChooseDialogComponent,
    IconeViewComponent
  ],
  templateUrl: './issutype-form2.component.html',
  styleUrl: './issutype-form2.component.css'
})
export class IssutypeForm2Component {

  form: FormGroup;
  @ViewChild(MatMenuTrigger) iconMenuTrigger!: MatMenuTrigger;

  @Output() oneSaved = new EventEmitter<IssueType>();
  @Output() cancelled = new EventEmitter<void>();

  @Input() level: 'PARENT' | 'SUB_TASK' = 'PARENT';
  @Input() parent: IssueType | null = null;
  /** true quand le formulaire est integre a un panneau et non a un menu flottant */
  @Input() embedded: boolean = false;

  /** type en cours de modification ; null pour une creation */
  private edited: IssueType | null = null;
  selectedIcone: Icone | undefined;
  project: Project;
  saving = false;
  errorMessage: string | undefined;

  colorPalette = [
    '#6C63FF', '#4f46e5', '#7c3aed',
    '#db2777', '#dc2626', '#ea7c0e',
    '#16a34a', '#0284c7', '#0891b2',
    '#374151', '#6b7280', '#9ca3af',
  ];

  constructor(
    private fb: FormBuilder,
    private issueService: IssueService
  ) {
    this.form = this.fb.group({
      name:        ['', Validators.required],
      prefix:      ['', Validators.required],
      description: [''],
      color:       ['#6C63FF'],
    });

    this.issueService.project$.subscribe(p => this.project = p);
  }

  /**
   * Alimente le formulaire pour une modification ; null repasse en creation.
   */
  @Input() set issueType(value: IssueType | null | undefined) {
    this.edited = value || null;
    if (!this.edited) {
      this.onReset();
      return;
    }
    this.errorMessage = undefined;
    this.form.reset({
      name: this.edited.name || '',
      prefix: this.edited.prefix || '',
      description: this.edited.description || '',
      color: this.edited.color || '#6C63FF'
    });
    this.selectedIcone = this.edited.icone;
    this.level = (this.edited.level as 'PARENT' | 'SUB_TASK') || 'PARENT';
    this.parent = this.edited.parent || null;
  }

  get isEdit(): boolean {
    return this.edited != null && this.edited.id != null;
  }

  setLevel(level: 'PARENT' | 'SUB_TASK'): void {
    this.level = level;
    this.onReset();
  }

  setParent(parent: IssueType | null | undefined): void {
    this.parent = parent || null;
    if (this.parent) {
      this.setLevel('SUB_TASK');
    }
  }

  onIconSelected(icone: Icone | any): void {
    this.selectedIcone = icone;
    this.iconMenuTrigger?.closeMenu();
  }

  onReset(): void {
    this.form.reset({ color: '#6C63FF', name: '', prefix: '', description: '' });
    this.selectedIcone = this.edited ? this.edited.icone : undefined;
    this.errorMessage = undefined;
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (this.form.invalid || !this.level || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = undefined;
    this.saving = true;

    const projectId = this.edited?.project?.id || this.project?.id;
    const issueType: IssueType = {
      level:       this.level,
      name:        this.form.value.name,
      prefix:      this.form.value.prefix,
      description: this.form.value.description,
      color:       this.form.value.color,
      icone:       this.selectedIcone,
      project:     { id: projectId },
    };

    if (this.isEdit) {
      // en modification, les relations non editees sont renvoyees telles quelles
      // pour ne pas etre ecrasees cote serveur.
      issueType.id = this.edited.id;
      issueType.style = this.edited.style;
      if (this.edited.curentWorkFlow) {
        issueType.curentWorkFlow = {id: this.edited.curentWorkFlow.id};
      }
    }

    if (this.level === 'SUB_TASK' && this.parent) {
      issueType.parent = { id: this.parent.id };
    }

    this.issueService.saveIssueType(issueType).subscribe({
      next: (saved) => {
        this.saving = false;
        this.oneSaved.emit(saved);
        if (!this.isEdit) {
          this.onReset();
        }
      },
      error: (error) => {
        this.errorMessage = this.extractMessage(error);
        this.saving = false;
      }
    });
  }

  private extractMessage(error: any): string {
    const graphQlMessage = error?.graphQLErrors?.length ? error.graphQLErrors[0].message : null;
    return graphQlMessage || error?.message || "Erreur lors de l'enregistrement.";
  }
}
