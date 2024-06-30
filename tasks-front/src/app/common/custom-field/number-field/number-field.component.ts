import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CustomFieldValue, DisplayCustomField} from "../../../type/issue";

@Component({
  selector: 'app-number-field',
  standalone: true,
  imports: [],
  templateUrl: './number-field.component.html',
  styleUrl: './number-field.component.css'
})
export class NumberFieldComponent implements DisplayCustomField{
  @Output() edit = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();
  @Input() isEditable = false;
  @Input() isEditing = false;
  customFieldValue: CustomFieldValue ;
  number : number;
  public value:any = {};


  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.edit.emit(this.customFieldValue);
    } else {
       this.saveValue();
    }
  }
  saveValue(){
    let value:CustomFieldValue ={
      date: '',
      string:'',
      id:this.customFieldValue.id,
      issue:this.customFieldValue.issue,
      numeric:this.number,
      user:undefined,
      customField:this.customFieldValue.customField,
      text:''
    };

    this.save.emit(value);

  }
  setCustomFieldValue(value: CustomFieldValue) {
    this.customFieldValue = value;
    this.value = value;
    this.number = this.value.number;
  }
}
