import {Component, Inject, Input} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import {Issue, Status} from "../../../../type/issue";
@Component({
  selector: 'app-edit-issue',
  templateUrl: './new-issue.component.html',
  styleUrl: './new-issue.component.css'
})
export class NewIssueComponent {
  issue : Issue = new Issue();
  status : Status|null = null ;
  summary: string = '';
  description: string = '';
  type: string = 'type1';

  constructor(public activeModal: NgbActiveModal) {}

  save() {
    this.issue.status = this.status;
    this.activeModal.close({ issue: this.issue });
  }
}
