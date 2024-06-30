import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CustomFieldValue, DisplayCustomField, User} from "../../../type/issue";

@Component({
  selector: 'app-user-field',
  standalone: true,
  imports: [],
  templateUrl: './user-field.component.html',
  styleUrl: './user-field.component.css'
})
export class UserFieldComponent implements DisplayCustomField{
  @Output() edit = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();
  @Input() isEditable = false;
  @Input() isEditing = false;
  customFieldValue: CustomFieldValue ;
  user :User;
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
      string:"",
      id:this.customFieldValue.id,
      issue:this.customFieldValue.issue,
      numeric:0,
      user:this.user,
      customField:this.customFieldValue.customField,
      text:''
    };

    this.save.emit(value);

  }
  setCustomFieldValue(value: CustomFieldValue) {
    this.customFieldValue = value;
    this.value = value;
    this.user = this.value.user;
  }
}
