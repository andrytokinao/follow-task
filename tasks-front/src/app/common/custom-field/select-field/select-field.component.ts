import {Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, Output} from '@angular/core';
import {CustomField, CustomFieldValue, DisplayCustomField, User} from "../../../type/issue";
import {IssueService} from "../../../services/issue.service";
import {ActivatedRoute} from "@angular/router";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {MatFormField, MatFormFieldModule} from "@angular/material/form-field";
import {MatOption, MatSelect, MatSelectModule} from "@angular/material/select";
import {FormsModule} from "@angular/forms";
import {MatRadioModule} from "@angular/material/radio";
import {BrowserModule} from "@angular/platform-browser";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [
    MatFormField,
    MatSelect,
    MatOption,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatRadioModule,
    CommonModule, // <-- Add CommonModule here
    MatSelectModule
  ],
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.css'
})
export class SelectFieldComponent  implements DisplayCustomField {
  @Output() edit = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();
  @Input() isEditable = false;
  @Input() isEditing = false;
  customFieldValue: CustomFieldValue ;
  string :'';
  public value:any = {};
  private customField: CustomField;
  protected options: String[];
  selectedOption: String;
  constructor(private issueService :IssueService
  ) {
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.edit.emit(this.customFieldValue);
    } else {
      this.save.emit(this.customFieldValue);
    }
  }
  saveValue(){
    let value:any ={
      date: '',
      string:this.selectedOption,
      id:this.customFieldValue.id,
      issue:this.customFieldValue.issue,
      numeric:0,
      user:undefined,
      customField:this.customFieldValue.customField,
      text:''
    };
    this.save.emit(value);

  }
  setCustomFieldValue(value: CustomFieldValue) {
    this.customFieldValue = value;
    this.value = value;
    this.selectedOption = this.value.string;
    this.getCustomField();

  }
  getCustomField() {
    this.issueService.getCustomField(this.customFieldValue.customField.id).subscribe(res => {
      this.customField = res;
      this.options = this.customField.options;
    })
  }
}
