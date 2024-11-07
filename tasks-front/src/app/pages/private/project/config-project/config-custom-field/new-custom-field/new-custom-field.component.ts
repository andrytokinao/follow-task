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
  templateUrl: './new-custom-field.component.html',
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule],
  styleUrl: './new-custom-field.component.css'
})
export class NewCustomFieldComponent {
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
    {value: 'Selection', viewValue: 'Selection'},
    {value: 'CheckBox', viewValue: 'Selection multiple'},
  ];
  save() {
    this.issueService.saveCustomField(this.customField).subscribe(customField=> {
      this.activeModal.close({ customField: customField });
    })
  }
}
