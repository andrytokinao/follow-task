import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CustomFieldValue, DisplayCustomField} from "../../../type/issue";

@Component({
  selector: 'app-multi-select-field',
  standalone: true,
  imports: [],
  templateUrl: './multi-select-field.component.html',
  styleUrl: './multi-select-field.component.css'
})
export class MultiSelectFieldComponent implements DisplayCustomField{
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

  customFieldValue: CustomFieldValue;
  isEditable: boolean;

  saveValue(): void {
  }
}
