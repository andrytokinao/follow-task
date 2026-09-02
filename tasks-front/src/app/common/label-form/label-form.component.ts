import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {MyCommonModule} from "../common.module";
import {Issue, IssueLabels, Label, Project} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AuthGuard} from "../../services/SystemGuard";
import {ProjectGuard} from "../../services/ProjectGuard";

@Component({
  standalone: false,
  selector: 'app-label-form',
  templateUrl: './label-form.component.html',
  styleUrl: './label-form.component.css'
})
export class LabelFormComponent implements OnInit,AfterViewInit{
  project:Project;
  labels:Label[] = [];
  @Input() issue:Issue;
  currentLabel:Label;
  @Output() save = new EventEmitter<any>();

  newLabel: Label ={};
  private toClose: boolean;
  constructor(private issueService:IssueService,
              private fb:FormBuilder,
              protected authGuard:AuthGuard,
              protected projectGuard: ProjectGuard
  ) {
    this.myForm = this.fb.group({
      name: ['', Validators.required],
    });
  }
  myForm: FormGroup;

  ngOnInit(): void {
    this.issueService.project$.subscribe(project => {
      this.project = project;
      if (this.project?.id) {
        this.issueService.getLabelByProject(this.project.id)
      }
    });
    this.issueService.allLabel$.subscribe(labels => {
      this.labels = labels;
    })
  }

  checkedLabel(label: Label) {
    return this.issue?.labels?.some(l => l.label?.id == label.id) ?? false;
  }

  checkLabel(event: any, label: Label) {
    if (event.checked) {
      this.addLabelInIssue(label.id);
    } else {
      this.removeLabelInIssue(label.id);
    }
  }


  selectIcone(icone: any) {
    this.newLabel.icone = icone;

  }

  protected readonly alert = alert;
  iscreateLabel = false;
  labColor: any;


  clickMenu($event:MouseEvent) {
    if (!this.toClose) {
      $event.stopPropagation();
    } else {
      this.toClose = false;
    }
  }

  ngAfterViewInit(): void {
      this.toClose = false;

  }
  reloadIssue(){
    this.issueService.getIssueById(this.issue.id).subscribe(issue => {
      this.issue = issue;
    })
  }

  update() {
    if (this.myForm.valid) {
      this.currentLabel.name = this.myForm.value.name;
      if (this.iscreateLabel) {
        this.currentLabel.color = this.labColor;
      }
      this.issueService.saveLabel(this.currentLabel);
      this.iscreateLabel = false;
      this.myForm.reset();
      this.currentLabel = undefined;
    }
  }
  addLabelInIssue(labelId:Number){
    this.issueService.addLabelInIssue(this.issue.id,labelId).subscribe(values => {
      this.issueService.getIssueById(this.issue.id).subscribe(issue =>{
        this.issue =issue;
      })
    })
  }
  removeLabelInIssue(labelId:Number){
    this.issueService.removeLabelInIssue(this.issue.id,labelId).subscribe(value => {
      this.issueService.getIssueById(this.issue.id).subscribe(issue =>{
        this.issue =issue;
      })
    })
  }
  createLabel() {
    this.currentLabel = {};
    this.labColor = undefined;
    this.myForm.reset();
    this.iscreateLabel = !this.iscreateLabel;
  }

  getLabelStyle(label) {
    if (!label?.color) {
      return '';
    }
    return 'background-color:' + label.color + ';color:' + this.contrastColor(label.color);
  }

  /** Texte foncé ou clair selon la luminance de la couleur de l'étiquette. */
  private contrastColor(color: string): string {
    const rgb = this.toRgb(color);
    if (!rgb) {
      return '#3c4257';
    }
    const [r, g, b] = rgb;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#3c4257' : '#ffffff';
  }

  private toRgb(color: string): number[] {
    let hex = color.trim();
    const rgbMatch = hex.match(/^rgba?\(([^)]+)\)$/i);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(',').map(p => parseFloat(p));
      return parts.length >= 3 ? parts.slice(0, 3) : null;
    }
    if (hex.startsWith('#')) {
      hex = hex.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      if (hex.length === 6 || hex.length === 8) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16),
        ];
      }
    }
    return null;
  }

  isEdit(label: Label) {
    if (!this.currentLabel)
      return false;
   return label.id === this.currentLabel.id;
  }

  editLabel(label: Label) {
    this.currentLabel = label;
    this.newLabel = {};
    this.iscreateLabel = false ;
    this.myForm.patchValue({name: label.name});
  }

  saveLabel(label: Label) {
    this.issueService.saveLabel(label);
  }

  select(option1: string) {

  }
}
