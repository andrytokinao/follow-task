import {Component, inject, Inject, Injector, Input, ViewChild,afterNextRender} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import {Issue, IssueType, Project, Status} from "../../../../../type/issue";
import {IssueService} from "../../../../../services/issue.service";
import {CdkTextareaAutosize} from "@angular/cdk/text-field";
@Component({
  selector: 'app-edit-issue',
  templateUrl: './new-issue.component.html',
  styleUrl: './new-issue.component.css'
})
export class NewIssueComponent {
  issue : any = {
    summary:"Test test  ",
    description :"description ",
  };
  status : Status|null = null ;
  summary: string = 'essai';
  description: string = '';
  type: string = 'type1';
  issueType: IssueType | any = {};
  issueTypes: IssueType[] = [];
  project:Project | undefined;
  @ViewChild('autosize') autosize: CdkTextareaAutosize | undefined;
  private _injector = inject(Injector);
  constructor(
    public activeModal: NgbActiveModal,
    public issueService:IssueService,
  ) {}

  save() {
    let issue:any = {};
    let project :any ={};
    let status :any ={};
    status.id = this.status?.id;
    issue.summary = this.summary;
    issue.description = this.description;
     project.id = this.project?.id;
     this.issueType.project = project;

    issue.issueType = this.issueType;
    issue.status = this.status;
      this.issueService.saveIssue(issue).subscribe((res:any)=>{
        this.activeModal.close({ issues: res.data.saveIssue });
      });
    }

  change() {
    console.log(JSON.stringify(this.issueType));

  }
}
