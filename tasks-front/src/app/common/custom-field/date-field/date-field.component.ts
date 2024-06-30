import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CustomFieldValue, DisplayCustomField} from "../../../type/issue";
import {DatePipe, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-date-field',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    NgIf
  ],
  templateUrl: './date-field.component.html',
  styleUrl: './date-field.component.css'
})
export class DateFieldComponent implements DisplayCustomField{
  @Output() edit = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();
  @Input() isEditable = false;
  @Input() isEditing = false;
  customFieldValue: CustomFieldValue ;
  date :string ="";
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
       date: this.date,
       string:"",
       id:this.customFieldValue.id,
       issue:this.customFieldValue.issue,
       numeric:0,
       user:undefined,
       customField:this.customFieldValue.customField,
       text:''
     };

     this.save.emit(value);

   }
  transformDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  setCustomFieldValue(value: CustomFieldValue) {
    this.customFieldValue = value;
    this.value = value;
    this.date = this.transformDate(this.value.date);
  }
}
