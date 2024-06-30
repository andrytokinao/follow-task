import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CustomFieldValue, DisplayCustomField} from "../../../type/issue";

@Component({
  selector: 'app-issue-field',
  standalone: true,
  imports: [],
  templateUrl: './issue-field.component.html',
  styleUrl: './issue-field.component.css'
})
export class IssueFieldComponent implements DisplayCustomField{
  @Output() edit = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();

  setCustomFieldValue(value: any): void {
    // Implement your logic here
  }

  customFieldValue: CustomFieldValue;
  isEditable: boolean;
  isEditing: boolean;

  saveValue(): void {
  }

}
