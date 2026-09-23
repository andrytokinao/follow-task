import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {NgClass, NgIf} from "@angular/common";
import {MyCommonModule} from "../common.module";
import {Icone, IssueType} from "../../type/issue";
import {
  cleanPrefixForSave,
  isPrefixTooLong,
  normalizePrefix,
  PREFIX_MAX_LENGTH
} from "../../type/issue-type-prefix.util";

@Component({
  standalone: false,
  selector: 'app-issuetype-form',
  templateUrl: './issuetype-form.component.html',
  styleUrl: './issuetype-form.component.css'
})
export class IssuetypeFormComponent {
  name:String ="";
  prefix:String = "";
  /** Longueur maximale du prefixe, meme regle que les autres formulaires. */
  readonly prefixMaxLength = PREFIX_MAX_LENGTH;

  /** Espaces normalises a la sortie du champ, pas pendant la frappe. */
  onPrefixBlur(): void {
    this.prefix = normalizePrefix(this.prefix as string);
  }

  /** Prefixe trop long : signale en rouge, l'enregistrement est bloque. */
  get prefixTooLong(): boolean {
    return isPrefixTooLong(this.prefix as string);
  }



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
    // Un prefixe trop long n'est pas envoye : le serveur le refuserait.
    if (this.prefixTooLong)
      return;
    let issueType:any = {};
    issueType.name = ('' + this.name).trim();
    // Espaces de tete et de fin retires a l'enregistrement.
    issueType.prefix = cleanPrefixForSave(this.prefix as string);
    if(this.icon)
      issueType.icone = this.icon;
    if(this.inputIssueType != null) {
      issueType.id = this.inputIssueType.id;
    }
    this.editing = false;
    // after saved
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
