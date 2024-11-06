import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CustomFieldValue, DisplayCustomField} from "../../../type/issue";
import {DatePipe, NgIf} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-number-field',
  standalone: true,
  imports: [
    DatePipe,
    NgIf,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './number-field.component.html',
  styleUrl: './number-field.component.css'
})
export class NumberFieldComponent implements DisplayCustomField{
  @Output() edit = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();
  @Input() isEditable = false;
  @Input() isEditing = false;
  customFieldValue: CustomFieldValue ;
  numeric : number;
  public value:any = {};

  saveValue(){
    let value:CustomFieldValue ={
      date: '',
      string:'',
      id:this.customFieldValue.id,
      issue:this.customFieldValue.issue,
      numeric:this.numeric,
      user:undefined,
      customField:this.customFieldValue.customField,
      text:''
    };

    this.save.emit(value);

  }
  setCustomFieldValue(value: CustomFieldValue) {
    this.customFieldValue = value;
    this.value = value;
    this.numeric = this.value.numeric;
  }
}
