import {
  Component,
  EventEmitter,
  Output, ViewChild
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
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
import {MyCommonModule} from "../common.module";
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

  level: 'PARENT' | 'SUB_TASK' = 'PARENT';
  parent: IssueType | null = null;
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

  setLevel(level: 'PARENT' | 'SUB_TASK'): void {
    this.level = level;
    this.onReset();
  }

  setParent(parent: IssueType | null): void {
    this.parent = parent;
    if (this.parent) {
      this.setLevel('SUB_TASK');
    }
  }

  onIconSelected(icone: Icone | any): void {
    this.selectedIcone = icone;
    this.iconMenuTrigger.closeMenu();
  }

  onReset(): void {
    this.form.reset({ color: '#6C63FF' });
    this.selectedIcone = undefined;
    this.errorMessage = undefined;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.level) return;

    this.errorMessage = undefined;
    this.saving = true;

    const issueType: IssueType = {
      level:   this.level,
      name:    this.form.value.name,
      prefix:  this.form.value.prefix,
      color:   this.form.value.color,
      style:   this.form.value.description,
      icone:   this.selectedIcone,
      project: { id: this.project.id },
    };

    if (this.level === 'SUB_TASK' && this.parent) {
      issueType.parent = { id: this.parent.id };
    }

    this.issueService.saveIssueType(issueType).subscribe({
      next: (saved) => {
        this.saving = false;
        this.oneSaved.emit(saved);
        this.onReset();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la création.';
        this.saving = false;
      }
    });
  }
}
