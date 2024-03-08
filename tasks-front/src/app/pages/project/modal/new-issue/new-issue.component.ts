import {Component, Inject, Input} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import {Issue, Status} from "../../../../type/issue";
import {IssueService} from "../../../../services/issue.service";
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
  summary: string = '';
  description: string = '';
  type: string = 'type1';


  constructor(
    public activeModal: NgbActiveModal,
    public issueService:IssueService,
  ) {}

  save() {
    let issue = {summary:"",description: ""};
    issue.summary = this.summary;
    issue.description = this.description;

      this.issueService.saveIssue(issue).subscribe((res:any)=>{
        this.activeModal.close({ issue: res.data.saveIssue });
      });
    }
}
