import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CustomFieldValue, DisplayCustomField} from "../../../type/issue";
import {DatePipe, NgIf} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [
    DatePipe,
    NgIf,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.css'
})
export class TextFieldComponent implements DisplayCustomField{
  @Output() edit = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();
  @Input() isEditable = false;
  @Input() isEditing = false;
  customFieldValue: CustomFieldValue ;
  text :string ="";
  public value:any = {};

  saveValue(){
    let value:CustomFieldValue ={
      date: '',
      string:this.text,
      id:this.customFieldValue.id,
      issue:this.customFieldValue.issue,
      numeric:0,
      user:undefined,
      customField:this.customFieldValue.customField,
      text:this.text
    };

    this.save.emit(value);

  }
  setCustomFieldValue(value: CustomFieldValue) {
    this.customFieldValue = value;
    this.value = value;
    this.text = this.value.string;
  }
}
