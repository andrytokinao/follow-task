import {Injectable, Type} from '@angular/core';
import {DisplayCustomField} from "../type/issue";
import {StringComponent} from "../common/custom-field/string/string.component";
import {NumberFieldComponent} from "../common/custom-field/number-field/number-field.component";
import {IssueFieldComponent} from "../common/custom-field/issue-field/issue-field.component";
import {DateFieldComponent} from "../common/custom-field/date-field/date-field.component";

@Injectable({
  providedIn: 'root'
})
export class DisplayCustomfielFactoryService {

  constructor() { }
  getComponent(type: string): DisplayCustomField {
    switch (type) {
      case 'string':
        return IssueFieldComponent;
      case 'number':
        return NumberFieldComponent;
      case 'date':
        return DateFieldComponent;
      default:
        throw new Error('Type de composant non pris en charge');
    }
  }
}
