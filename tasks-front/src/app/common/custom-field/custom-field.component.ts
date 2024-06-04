import {Component, ComponentFactoryResolver, Input, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {DisplayCustomfielFactoryService} from "../../services/display-customfiel-factory.service";
import {CustomFieldValue, DisplayCustomField} from "../../type/issue";

@Component({
  selector: 'app-custom-field',
  standalone: true,
  imports: [],
  templateUrl: './custom-field.component.html',
  styleUrl: './custom-field.component.css'
})
export class CustomFieldComponent implements OnInit{
  @Input() customFieldValue: CustomFieldValue;
  @Input() type: string;
  @ViewChild('container', { read: ViewContainerRef, static: true }) container: ViewContainerRef;

  ngOnInit(): void {
    const componentType:DisplayCustomField =  this.factory.getComponent(this.type);
    const factory = this.resolver.resolveComponentFactory(componentType);
    const componentRef = this.container.createComponent(factory);

    const instance = componentRef.instance as DisplayCustomField;
    instance.setCustomFieldValue(this.customFieldValue);

    instance.edit.subscribe((newData: any) => this.onEdit(newData));
    instance.save.subscribe((newData: any) => this.onSave(newData));
  }
  constructor(
    private resolver: ComponentFactoryResolver,
    private factory: DisplayCustomfielFactoryService,
  ) {
  }

  private onEdit(newData: any) {

  }

  private onSave(newData: any) {

  }
}
