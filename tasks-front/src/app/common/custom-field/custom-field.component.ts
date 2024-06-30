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
import {CustomFieldValue, DisplayCustomField} from "../../type/issue";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-custom-field',
  standalone: true,
  imports: [
    NgIf
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
      this.instance.isEditing = true;
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
}
