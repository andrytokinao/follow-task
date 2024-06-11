import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {CustomField} from "../../../../../../type/issue";
import {IssueService} from "../../../../../../services/issue.service";
import {MatFormField, MatFormFieldModule} from "@angular/material/form-field";
import {MatSelect, MatSelectModule} from "@angular/material/select";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
interface Field {
  value: string;
  viewValue: string;
}
@Component({
  selector: 'app-edit-custom-field',
  standalone: true,
  templateUrl: './edit-custom-field.component.html',
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule],
  styleUrl: './edit-custom-field.component.css'
})
export class EditCustomFieldComponent {
  customField: CustomField  | any= {};
  constructor(
    public activeModal: NgbActiveModal,
    private issueService:IssueService,
  ) {
  }
  fields: Field[] = [
    {value: 'String', viewValue: 'Text'},
    {value: 'Number', viewValue: 'Nombre'},
    {value: 'User', viewValue: 'Utilisateur '},
    {value: 'Date', viewValue: 'Date'},
  ];
  save() {
    alert(JSON.stringify(this.customField));
    this.issueService.saveCustomField(this.customField).subscribe(customFields=> {
      this.activeModal.close({ customFields: customFields });
    })
  }
}
