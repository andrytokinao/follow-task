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
import {CommonModule, NgIf} from "@angular/common";
import {MyCommonModule} from "../common.module";
import {ProjectGuard} from "../../services/ProjectGuard";
import {IssueService} from "../../services/issue.service";
import {IconeViewComponent} from "../icone-view/icone-view.component";

@Component({
  selector: 'app-custom-field',
  standalone: true,
  imports: [
    NgIf,
    MyCommonModule,
    CommonModule,
    IconeViewComponent
  ],
  templateUrl: './custom-field.component.html',
  styleUrl: './custom-field.component.css'
})
export class CustomFieldComponent implements OnInit{
  @Input() viewMode: string='chip';
  @Input() customFieldValue: CustomFieldValue;
  @ViewChild('container', { read: ViewContainerRef, static: true }) container: ViewContainerRef;
  @Output() saved = new EventEmitter<CustomFieldValue>();
  @Output() onSaved = new EventEmitter<CustomFieldValue[]>();
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
    protected   projectCuard: ProjectGuard,
    private issueService:IssueService
) {
  }

  private onEdit(newData: any) {

  }

  private onSave(newData: CustomFieldValue) {
    this.customFieldValue = newData;
    this.customFieldValue.issue = {id:newData.issue.id}

    this.issueService.saveValues(this.customFieldValue).subscribe(
      value => {
        this.onSaved.emit(value);
        this.instance.isEditing = false;
      }, error => {
        console.error(error)

    })
 /*     this.customFieldValue = newData;
      this.saved.emit(this.customFieldValue);
      this.instance.isEditing = false;*/
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
  public static getDisplayOptions(): any[] {
    return [
      {  name: 'DisplayInList', label:"Affichage dans la liste" },
      {  name: 'DisplayIfEmpty', label:"Afficher si le contenue est vide"},
    ];
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
  isDisplayInList(){
    return false;
  }
  isReadOnly(){
    return false;
  }
  isFullShow() {
      return true;
  }
  getClass(){
    return this.viewMode;
  }

  setViewMode(viewMode: string) {
    this.viewMode = viewMode;
  }
}
/*whith-icone;
whith-icone-ro;
ro;
info;
info-edit;
view;
chip;*/
