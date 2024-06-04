import {Component, EventEmitter} from '@angular/core';
import {DisplayCustomField} from "../../../type/issue";

@Component({
  selector: 'app-date-field',
  standalone: true,
  imports: [],
  templateUrl: './date-field.component.html',
  styleUrl: './date-field.component.css'
})
export class DateFieldComponent implements DisplayCustomField{
  setCustomFieldValue(value: any): void {
  }

  edit: EventEmitter<any>;
  save: EventEmitter<any>;

}
