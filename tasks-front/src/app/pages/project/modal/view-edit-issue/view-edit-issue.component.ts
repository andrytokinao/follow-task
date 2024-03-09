import {Component, Inject, Input} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import {Issue, Status} from "../../../../type/issue";
import {IssueService} from "../../../../services/issue.service";
@Component({
  selector: 'app-view-edit-issue',
  templateUrl: './view-edit-issue.component.html',
  styleUrl: './view-edit-issue.component.css'
})
export class ViewEditIssueComponent {
  issue : any = new Issue();
  type: string = 'type1';

  editingDescription: boolean = false;
  activeMenuItem: string="comment";
  newComment: string = '';


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

  }

  addCostumFieldValu() {

  }
}
