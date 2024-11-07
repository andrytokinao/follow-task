import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CustomField, CustomFieldValue, DisplayCustomField} from "../../../type/issue";
import {MatCheckbox, MatCheckboxChange} from "@angular/material/checkbox";
import {FormsModule} from "@angular/forms";
import {IssueService} from "../../../services/issue.service";
import {NgForOf, NgIf} from "@angular/common";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatOption} from "@angular/material/autocomplete";
import {MatSelect} from "@angular/material/select";

@Component({
  selector: 'app-multi-select-field',
  standalone: true,
  imports: [
    MatCheckbox,
    FormsModule,
    NgForOf,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    NgIf
  ],
  templateUrl: './multi-select-field.component.html',
  styleUrl: './multi-select-field.component.css'
})
export class MultiSelectFieldComponent implements DisplayCustomField{
  @Output() edit = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();
  @Input() isEditable = false;
  @Input() isEditing = false;
  customFieldValue: CustomFieldValue ;
  string :'';
  public value:any = {};
  private customField: CustomField;
  protected options: String[];
  protected values: String[];
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
    let value:CustomFieldValue ={
      date: '',
      string:'',
      id:this.customFieldValue.id,
      issue:this.customFieldValue.issue,
      numeric:0,
      user:undefined,
      customField:this.customFieldValue.customField,
      text:'',
      values:this.values
    };
    this.save.emit(value);

  }
  setCustomFieldValue(value: CustomFieldValue) {
    this.customFieldValue = value;
    this.values = value.values;
    this.selectedOption = this.value.string;
    this.getCustomField();

  }
  getCustomField() {
    this.issueService.getCustomField(this.customFieldValue.customField.id).subscribe(res => {
      this.customField = res;
      this.options = this.customField.options;
    })
  }

  isSelected(option) {
    if( this.values == null)
      return false;
    return this.values.some(s => s == option);
  }

  onCheckboxChange(event: any, option: String) {
    if (this.values == null) {
      this.values = [];
    }
    this.values = JSON.parse(JSON.stringify(this.values));
    if (event.checked) {
      this.values.push(option);
    } else {
      this.values = this.values.filter(v => v != option)
    }
  }

  partiallyComplete() {
    return undefined;
  }
}
