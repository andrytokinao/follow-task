import {Component, EventEmitter} from '@angular/core';
import {DisplayCustomField} from "../../../type/issue";

@Component({
  selector: 'app-issue-field',
  standalone: true,
  imports: [],
  templateUrl: './issue-field.component.html',
  styleUrl: './issue-field.component.css'
})
export class IssueFieldComponent implements DisplayCustomField{
  setCustomFieldValue(value: any): void {
  }

  edit: EventEmitter<any>;
  save: EventEmitter<any>;

}
