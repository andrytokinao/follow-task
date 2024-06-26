import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DisplayCustomField} from "../../../type/issue";
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
  @Input() data: Date;
  @Output() edit = new EventEmitter<Date>();
  @Output() save = new EventEmitter<Date>();

  isEditing = false;



  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.edit.emit(this.data);
    } else {
      this.save.emit(this.data);
    }
  }

  setCustomFieldValue(data: any) {
    this.data = data;
  }

}
