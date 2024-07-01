import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {NgClass, NgIf} from "@angular/common";
import {MyCommonModule} from "../common.module";
import {Icone, IssueType} from "../../type/issue";

@Component({
  selector: 'app-issuetype-form',
  templateUrl: './issuetype-form.component.html',
  styleUrl: './issuetype-form.component.css'
})
export class IssuetypeFormComponent {
  name:String ="";
  prefix:String = "";



  @Input() inputIssueType: any | undefined;
  @Output() inputModelChange = new EventEmitter<string>();
  @Input() label: String = "";
  @Input() exemple: String ="";
  @Input() readonly : Boolean = false;
  @Input() selected : boolean = false;
  @Output() onClickIt : EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onComplete : EventEmitter<IssueType> = new EventEmitter<IssueType>();
  @Output() onCancel : EventEmitter<boolean> = new EventEmitter<boolean>();
  text:string = ""
  @Input() editing:boolean = false;
  issutType: any = {};
  icon:Icone | undefined;
  constructor() {
    if (!this.readonly) {
      if (this.inputIssueType == null ){
        this.editing = true;
      }
    }
  }

  edit() {
    if (!this.readonly) {
      this.editing = true;
      if (this.inputIssueType){
        this.name = this.inputIssueType.name;
        this.prefix = this.inputIssueType.prefix;
      }
      ;
    }
  }

  save() {
    let issueType:any = {};
    issueType.name = this.name;
    issueType.prefix = this.prefix;
    if(this.icon)
      issueType.icone = this.icon;
    if(this.inputIssueType != null) {
      issueType.id = this.inputIssueType.id;
    }
    this.editing = false;
    // after save
    this.inputIssueType = issueType;
    this.onComplete.emit(this.inputIssueType);



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
    console.info('selected '+this.issutType+' is '+this.selected);
    return  this.selected? 'selected':"";
  }

  selectIcon(icone: any) {
    this.icon = icone;
  }
}
