import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Icone, IssueType, Status} from "../../type/issue";

@Component({
  selector: 'app-states-form',
  templateUrl: './states-form.component.html',
  styleUrl: './states-form.component.css'
})
export class StatesFormComponent {
  displayName:String ="";
  prefix:String = "";



  @Input() inputState: any | undefined;
  @Output() inputModelChange = new EventEmitter<string>();
  @Input() label: String = "";
  @Input() exemple: String ="";
  @Input() readonly : Boolean = false;
  @Input() selected : boolean = false;
  @Output() onClickIt : EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onComplete : EventEmitter<Status> = new EventEmitter<Status>();
  @Output() onCancel : EventEmitter<boolean> = new EventEmitter<boolean>();
  text:string = ""
  @Input() editing:boolean = false;
  state: any = {};
  icon:Icone | undefined;
  constructor() {
    if (!this.readonly) {
      if (this.inputState == null ){
        this.editing = true;
      }
    }
  }

  edit() {
    if (!this.readonly) {
      this.editing = true;
      if (this.inputState){
        this.displayName = this.inputState.displayName;
      }
      ;
    }
  }

  save() {
    let state:any = {};
    state.displayName = this.displayName;
    if(this.icon)
      state.icone = this.icon;
    else if (this.inputState.icone)
      state.icone = this.inputState.icone;

    if(this.inputState != null) {
      state.id = this.inputState.id;
    }
    this.editing = false;
    // after save
    this.inputState = state;
    this.onComplete.emit(state);



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
    console.info('selected '+this.state+' is '+this.selected);
    return  this.selected? 'selected':"";
  }

  selectIcon(icone: any) {
    this.icon = icone;
  }
}
