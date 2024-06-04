import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {CustomField} from "../../../../../../type/issue";
import {IssueService} from "../../../../../../services/issue.service";

@Component({
  selector: 'app-edit-custom-field',
  templateUrl: './edit-custom-field.component.html',
  styleUrl: './edit-custom-field.component.css'
})
export class EditCustomFieldComponent {

  customField: CustomField  | any= {};
  constructor(
    public activeModal: NgbActiveModal,
    private issueService:IssueService,
  ) {
  }
  save() {
    this.issueService.saveCustomField(this.customField).subscribe(customFields=> {
      this.activeModal.close({ customFields: customFields });
    })
  }
}
