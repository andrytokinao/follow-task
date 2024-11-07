import {
  Component,
  ComponentFactoryResolver,
  EventEmitter,
  Input,
  OnInit, Output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {DisplayCustomfielFactoryService} from "../../services/display-customfiel-factory.service";
import {CustomField, CustomFieldValue, DisplayCustomField, Icone, Issue} from "../../type/issue";
import {NgIf} from "@angular/common";
import {MyCommonModule} from "../common.module";

@Component({
  selector: 'app-custom-field',
  standalone: true,
  imports: [
    NgIf,
    MyCommonModule
  ],
  templateUrl: './custom-field.component.html',
  styleUrl: './custom-field.component.css'
})
export class CustomFieldComponent implements OnInit{
  @Input() customFieldValue: CustomFieldValue;
  @ViewChild('container', { read: ViewContainerRef, static: true }) container: ViewContainerRef;
  @Output() save = new EventEmitter<CustomFieldValue>();
   instance :DisplayCustomField | undefined;
  ngOnInit(): void {

    const componentType = this.factory.getComponent(this.customFieldValue.customField.type);
    const factory = this.resolver.resolveComponentFactory(componentType);
    const componentRef = this.container.createComponent(factory);

    this.instance = componentRef.instance as DisplayCustomField;
    this.instance.setCustomFieldValue(this.customFieldValue);

    this.instance.edit.subscribe((newData: any) => this.onEdit(newData));
    this.instance.save.subscribe((newData: any) => this.onSave(newData));
    if (this.customFieldValue.id == null) {
    //  this.instance.isEditing = true;
    }
  }
  constructor(
    private resolver: ComponentFactoryResolver,
    private factory: DisplayCustomfielFactoryService,
  ) {
  }

  private onEdit(newData: any) {

  }

  private onSave(newData: any) {
      this.customFieldValue = newData;
      this.save.emit(this.customFieldValue);
      this.instance.isEditing = false;
  }

  saveIt() {
    this.instance.saveValue();
  }

  toggleEdit() {
    this.instance.isEditing = true;
  }


  public static getIcone(customField:CustomField): any {
    const icons = new Map([
      ["Date", { "typeIcone": "class", "value": "fa fa-calendar-alt", "id": "\uf073" }],
      ["Number", { "typeIcone": "class", "value": "fa fa-sort-numeric-up", "id": "\uf163" }],
      ["Issue", { "typeIcone": "class", "value": "fa fa-exclamation-circle", "id": "\uf06a" }],
      ["String", { "typeIcone": "class", "value": "fa fa-font", "id": "\uf031" }],
      ["Link", { "typeIcone": "class", "value": "fa fa-link", "id": "\uf0c1" }],
      ["User", { "typeIcone": "class", "value": "fa fa-user", "id": "\uf007" }],
      ["CheckBox", { "typeIcone": "class", "value": "fa fa-check-square", "id": "\uf14a" }],
      ["Selection", { "typeIcone": "class", "value": "fa fa-caret-down", "id": "\uf0d7" }]
    ]);

    return icons.get(customField.type);
  }
  public static newValue(i:Issue,customField:CustomField):any{
    let customFieldValue : any = {};
    let issue:any = {};
    issue.id = i.id;
    customFieldValue.customField = customField;
    customFieldValue.issue = issue;
    return customFieldValue;
  }

  getIcone(customField: CustomField) {
    return CustomFieldComponent.getIcone(customField);
  }
}
