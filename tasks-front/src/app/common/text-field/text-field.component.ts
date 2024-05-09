import {Component, EventEmitter, input, Input, Output} from '@angular/core';
import {CommonModule}  from "@angular/common";
import FormsModule from "@angular/forms"

@Component({
  selector: 'app-text-field',
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.css'
})
export class TextFieldComponent {
  @Input() inputModel: string =" ";
  @Output() inputModelChange = new EventEmitter<string>();
  @Input() label: String = "";
  @Input() exemple: String ="";
  @Input() readonly : Boolean = false;
  @Input() selected : boolean = false;
  @Output() onClickIt : EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onComplete : EventEmitter<String> = new EventEmitter<String>();
  @Output() onCancel : EventEmitter<boolean> = new EventEmitter<boolean>();
  text:string = ""
  @Input() editing:boolean = false;

  constructor() {
    if (!this.readonly) {
      if (this.inputModel == null || this.inputModel == ""){
        this.editing = true;
      }
    }
  }

  edit() {
    if (!this.readonly) {
      this.editing = true;
      this.text = this.inputModel.toString();
    }
  }

  save() {
    this.inputModel =this.text;
    this.onComplete.emit(this.text);
    this.editing = false;
  }
  isValid(){
    if (!this.editing)
      return false;
    return  this.text!= null && this.text !="";

  }
  cancel(){
    this.text ="";
    this.editing = false;
    this.onCancel.emit(true);
  }
  select(){
    this.onClickIt.emit(this.selected);
  }
  isSelected():string {
    return  this.selected? 'selected':"";
  }
}
