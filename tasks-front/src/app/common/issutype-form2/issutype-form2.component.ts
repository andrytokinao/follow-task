import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {MatFormField, MatFormFieldModule} from "@angular/material/form-field";
import {NgIf} from "@angular/common";
import {MatInput, MatInputModule} from "@angular/material/input";
import {Observable} from "rxjs";
import {IssueType, Project} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {error} from "@angular/compiler-cli/src/transformers/util";

@Component({
  selector: 'app-issutype-form2',
  imports: [
    MatFormField,
    MatCardTitle,
    MatCardContent,
    MatCard,
    MatCardHeader,
    MatIcon,
    MatButton,
    ReactiveFormsModule,
    NgIf,
    MatInput,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './issutype-form2.component.html',
  styleUrl: './issutype-form2.component.css'
})
export class IssutypeForm2Component implements OnInit, AfterViewInit{
  form: FormGroup;
  @Input() selectedType$:Observable<'PARENT' | 'SUB_TASK'>;
  @Output() oneSaved:EventEmitter<IssueType> = new EventEmitter<IssueType>;
  selectedType: 'PARENT' | 'SUB_TASK';
  project: Project;
  private errorMessage: string;

  constructor(
    private fb: FormBuilder,
    private issueService:IssueService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      prefix: ['', Validators.required]
    });
  }

  placeholders = {
    PARENT: {
      name: 'Ex: Étude topographique complète de la route',
      prefix: 'Ex: ETR'
    },
    SUB_TASK: {
      name: 'Ex: Relevé topographique secteur A',
      prefix: 'Ex: RTS-A'
    }
  };
  selectedParent:IssueType;
  @Input()  selectedParent$:Observable<IssueType>;

  onSubmit() {
    let issueType: IssueType = {
      level: this.selectedType,
      name: this.form.get('name')?.value,
      prefix: this.form.get('prefix')?.value,
      project:{id:this.project.id}
    };
    if (this.selectedType == 'SUB_TASK') {
      issueType.parent = {id:this.selectedParent.id}
    }
    this.issueService.saveIssueType(issueType).subscribe( res => {
      this.oneSaved.emit(issueType);
      this.form.reset();
    },error => {
      this.errorMessage = 'Erreur survenu lors de la creation ';
      }
    )
  }

  ngOnInit(): void {
    this.selectedType$.subscribe(selectType => {
    this.selectedType = selectType;
      this.issueService.project$.subscribe(project => {this.project = project});

    });
  }

  ngAfterViewInit(): void {
    this.selectedParent$.subscribe(parent => {
      if (parent)
        alert(parent.name);
      this.selectedParent = parent;
    })
  }
}
