import {
  Component,
  ComponentFactoryResolver,
  EventEmitter,
  HostBinding,
  Input,
  OnInit, Output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {Observable, shareReplay} from "rxjs";
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
  /** Modes de présentation supportés ; toute autre valeur retombe sur `chip`. */
  private static readonly VIEW_MODES = ['chip', 'info-edit', 'view', 'ro'];

  @Input() viewMode: string='chip';
  @Input() customFieldValue: CustomFieldValue;
  @ViewChild('container', { read: ViewContainerRef, static: true }) container: ViewContainerRef;
  @Output() saved = new EventEmitter<CustomFieldValue>();
  @Output() onSaved = new EventEmitter<CustomFieldValue[]>();
   instance :DisplayCustomField | undefined;

  /** Les appelants passent tantôt `info-edit`, tantôt `field-info-edit`, tantôt rien. */
  get mode(): string {
    const raw = (this.viewMode || '').replace(/^field-/, '');
    return CustomFieldComponent.VIEW_MODES.includes(raw) ? raw : 'chip';
  }

  @HostBinding('class')
  get hostClass(): string {
    return 'cf-host cf-host--' + this.mode;
  }

  // Mis en cache : `hasCredential` refait tout son travail à chaque abonnement,
  // et le template s'y abonnait deux fois par champ.
  canEdit$: Observable<boolean>;

  ngOnInit(): void {
    this.canEdit$ = this.projectCuard.hasCredential(['CAN_EDIT_FIELD']).pipe(shareReplay(1));

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
        // `saved` n'était jamais émis : les parents qui n'écoutent que lui
        // (add-new-value) ne fermaient jamais leur éditeur.
        this.saved.emit(this.customFieldValue);
        this.instance.isEditing = false;
      }, error => {
        console.error(error)

    })
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
  setViewMode(viewMode: string) {
    this.viewMode = viewMode;
  }
}
