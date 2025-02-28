import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {MyCommonModule} from "../common.module";
import {Issue, Label, Project} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import _default from "chart.js/dist/plugins/plugin.legend";
import labels = _default.defaults.labels;
import {AuthGuard} from "../../services/SystemGuard";

@Component({
  selector: 'app-label-form',
  templateUrl: './label-form.component.html',
  styleUrl: './label-form.component.css'
})
export class LabelFormComponent implements OnInit,AfterViewInit{
  project:Project;
  labels:Label[] = [];
  @Input() issue:Issue;

  newLabel: Label ={};
  private toClose: boolean;
  constructor(private issueService:IssueService,
              private fb:FormBuilder,
              protected authGuard:AuthGuard,
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
    return this.issue.labels.some(l => l.label?.id == label.id);
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

  save($event: MouseEvent) {
    this.toClose = true;
  }
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

  onSubmit() {
    if (this.myForm.valid) {
      console.log('Formulaire soumis avec :', this.myForm.value);
      this.newLabel.name = this.myForm.value['name'];
      this.issueService.saveLabel(this.newLabel);
      this.iscreateLabel = false;
      this.myForm.reset();
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
    this.iscreateLabel = !this.iscreateLabel;
  }
}
