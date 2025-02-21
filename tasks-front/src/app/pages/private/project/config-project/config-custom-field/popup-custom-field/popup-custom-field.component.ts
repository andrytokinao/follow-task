import {Component, OnInit} from '@angular/core';

import {CustomField, IssueType, UsingCustomField} from "../../../../../../type/issue";
import {IssueService} from "../../../../../../services/issue.service";
import {ActivatedRoute} from "@angular/router";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {CustomFieldComponent} from "../../../../../../common/custom-field/custom-field.component";

@Component({
  selector: 'app-popup-custom-field',


  templateUrl: './popup-custom-field.component.html',
  styleUrl: './popup-custom-field.component.css'
})
export class PopupCustomFieldComponent implements OnInit{
   issueTypes:IssueType[] = [];
   customField :CustomField | any = {};
  private usingCustomFields: UsingCustomField[] = [];
  options:String[]=[];
  newOption: string ="";
  constructor(private issueService :IssueService,
              private route: ActivatedRoute,
              public activeModal: NgbActiveModal,
  ) {
  }
  onCancelClick() {
    this.activeModal.close({customField:this.customField });
  }

  ngOnInit(): void {
  }

  onSaveClick() {
    this.activeModal.close({customField:this.customField });

  }
  onCheckboxChange( issueType: IssueType) {
   this.toggleCheck(issueType);
  }
  useCustomField(it:any){
    const usingCustomField : UsingCustomField | any = {};
    const issueType : IssueType | any = {};

    const customField: CustomField | any = {};
    customField.id = this.customField.id;
    customField.name = this.customField.name;
    issueType.id = it.id
    usingCustomField.customField = customField;
    usingCustomField.issueType = issueType;
    this.issueService.useCustomField(usingCustomField).subscribe((result)=> {
      this.issueService.getCustomField(this.customField.id).subscribe(cf => {
        this.customField = cf;
        this.displayOptionSelected = cf.configDisplay;
      });
    })
  }
  unUse(it :any) {
    const usingCustomField : UsingCustomField | any = {};
    const issueType : IssueType | any = {};
    const customField: CustomField | any = {};
    customField.id = this.customField.id;
    customField.name = this.customField.name;
    issueType.id = it.id
    usingCustomField.customField = customField;
    usingCustomField.issueType = issueType;
    this.issueService.unUseCustomField(usingCustomField).subscribe((result)=> {
      this.issueService.getCustomField(this.customField.id).subscribe(cf => {
        this.customField = cf;
        this.displayOptionSelected = cf.configDisplay;
      });

    })
  }

  isUsing(it: IssueType) {
   return this.customField.allIssueTypes.some(selected => selected.issueType.id === it.id);
  }

  toggleCheck(it: IssueType) {
    if (this.isUsing(it)){
        this.unUse(it);
    } else {
      this.useCustomField(it);
    }
  }
  getCustomField(id) {
    this.issueService.getCustomField(id).subscribe(res => {
      this.customField = res;
      this.options = this.customField.options;
      this.displayOptionSelected = res.configDisplay;

    })
  }

  onEnter() {
    if (this.newOption != "") {
      if(this.options == null) {
        this.options = [];
      }
      this.options.push(this.newOption);
      this.customField.options = this.options;

      this.newOption ="";
    }
  }
  save(){
    this.customField.configDisplay = this.displayOptionSelected;
    this.issueService.saveCustomField(this.customField).subscribe(customField=> {
      this.customField = customField;
      this.options = customField.options;
      this.displayOptionSelected = customField.configDisplay;
    })
  }
  protected displayOptionSelected:String[] = [];
  protected readonly dispatchEvent = dispatchEvent;
  protected displayOptions: any [] =CustomFieldComponent.getDisplayOptions();

  onChangeDisplayOptions(event: any,display: String) {
    if (this.displayOptionSelected == null) {
      this.displayOptionSelected = [];
    }
    this.displayOptionSelected = JSON.parse(JSON.stringify(this.displayOptionSelected));
    if(event.checked) {
      this.displayOptionSelected.push(display);
    } else {
      this.displayOptionSelected = this.displayOptionSelected.filter( d => d != display);
    }
    this.customField.configDisplay = this.displayOptionSelected;
    this.save();

  }

  isSelected(option) {
    if( this.displayOptionSelected == null)
      return false;
    return this.displayOptionSelected.some(s => s == option);
  }
}
