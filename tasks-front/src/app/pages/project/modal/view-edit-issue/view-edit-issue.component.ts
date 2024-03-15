import {Component, Inject, Input} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import {Issue, Status, Comment, CustomFieldValue, CustomField} from "../../../../type/issue";
import {IssueService} from "../../../../services/issue.service";
@Component({
  selector: 'app-view-edit-issue',
  templateUrl: './view-edit-issue.component.html',
  styleUrl: './view-edit-issue.component.css'
})
export class ViewEditIssueComponent {
  type: string = 'type1';
  comment:any = {
    issue:{},
    user:{}
  };
  comments :Comment[] = [];
  customFieldValues :CustomFieldValue[] = [];
  customFields :CustomField[] = [];
  editingDescription: boolean = false;
  activeMenuItem: string="comment";
  newComment: string = '';
  issue: Issue = new Issue();



  constructor(
    public activeModal: NgbActiveModal,
    public issueService:IssueService,
  ) {}
  editDescription(){
    this.editingDescription =!this.editingDescription;
  }
  save() {
    this.issueService.saveIssue(this.issue).subscribe((res:any)=>{
      this.activeModal.close({ issue: res.data.saveIssue });
    });
  }
  toggleMenu(menu:string) {
    this.activeMenuItem = menu;
  }

  addComment() {
    this.comment.user.id = this.issue.assigne.id;// TODO: Change to user connected
    this.comment.issue.id = this.issue.id;

    this.issueService.addComment(this.comment).subscribe(
      {
        next:(result:any)=>{
          console.info("--- Loadin adding comment ---> "+JSON.stringify(result));
          this.comments = result.data.addComment as Comment[];
          this.comment.text="";
        },
          error:(err)=>{
        alert(JSON.stringify(err));
      }
    });
  }
  loadComments(){
    console.info("--- Loading  comment ---")
    this.issueService.allComment(this.issue.id).subscribe(
      {
        next:(res:any)=>{
          this.comments =res.data.allComment as Comment[];
          console.info("--- Loadin comment ---> "+JSON.stringify(this.comments));
        },
        error:(err:any)=>{
          alert(JSON.stringify(err))
        }
      }
    );
  }
  loadValues(){
    console.info("--- Loading  values ---")
    this.issueService.getValues(this.issue.id).subscribe(
      {
        next:(res:any)=>{
          this.customFieldValues =res.data.getValues as CustomFieldValue[];
          console.info("--- Loadin customField values ---> "+JSON.stringify(this.customFieldValues));
        },
        error:(err:any)=>{
          alert(JSON.stringify(err))
        }
      }
    );
  }
  addCustomFieldValue() {

  }
}
