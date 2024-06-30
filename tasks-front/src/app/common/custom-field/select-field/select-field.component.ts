import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CustomFieldValue, DisplayCustomField, User} from "../../../type/issue";

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [],
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


  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.edit.emit(this.customFieldValue);
    } else {
      this.customFieldValue.date = this.date
      this.save.emit(this.customFieldValue);
    }
  }
  saveValue(){
    let value:CustomFieldValue ={
      date: '',
      string:this.string,
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
    this.string = this.value.string;
  }
}
