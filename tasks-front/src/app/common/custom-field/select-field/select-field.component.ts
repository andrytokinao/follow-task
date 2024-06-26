import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DisplayCustomField} from "../../../type/issue";

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [],
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.css'
})
export class SelectFieldComponent  implements DisplayCustomField {
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
