import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DisplayCustomField} from "../../../type/issue";

@Component({
  selector: 'app-number-field',
  standalone: true,
  imports: [],
  templateUrl: './number-field.component.html',
  styleUrl: './number-field.component.css'
})
export class NumberFieldComponent implements DisplayCustomField{
  @Input() data: Number;
  @Output() edit = new EventEmitter<Number>();
  @Output() save = new EventEmitter<Number>();

  isEditing = false;

  setCustomFieldValue(data: any) {
    this.data = data;
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.edit.emit(this.data);
    } else {
      this.save.emit(this.data);
    }
  }
}
