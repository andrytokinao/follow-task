import { Injectable, Type } from '@angular/core';
import { NumberFieldComponent } from '../common/custom-field/number-field/number-field.component';
import { IssueFieldComponent } from '../common/custom-field/issue-field/issue-field.component';
import { DateFieldComponent } from '../common/custom-field/date-field/date-field.component';
import {DisplayCustomField} from "../type/issue";
import {TextFieldComponent} from "../common/custom-field/text-field/text-field.component";
import {UserFieldComponent} from "../common/custom-field/user-field/user-field.component";
import {MultiSelectFieldComponent} from "../common/custom-field/multi-select-field/multi-select-field.component";
import {SelectFieldComponent} from "../common/custom-field/select-field/select-field.component";

@Injectable({
  providedIn: 'root'
})
export class DisplayCustomfielFactoryService {

  private components: { [key: string]: Type<DisplayCustomField> } = {
    Date: DateFieldComponent,
    Number: NumberFieldComponent,
    Issue: IssueFieldComponent,
    String: TextFieldComponent,
    User:UserFieldComponent,
    CheckBox:MultiSelectFieldComponent,
    Selection:SelectFieldComponent
  };

  constructor() { }

  getComponent(type: string): Type<DisplayCustomField> {
    const component = this.components[type];
    if (!component) {
      throw new Error(`Type de composant non pris en charge: ${type}`);
    }
    return component;
  }
}
