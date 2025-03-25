import {Component, inject} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {CustomField, IssueType, UsingCustomField} from "../../../../../../type/issue";
import {IssueService} from "../../../../../../services/issue.service";
import {ActivatedRoute} from "@angular/router";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {CustomFieldComponent} from "../../../../../../common/custom-field/custom-field.component";

import {StepperSelectionEvent} from "@angular/cdk/stepper";
interface Field {
  value: string;
  viewValue: string;
}
@Component({
  selector: 'app-custom-field-sepper',
  standalone: false,
  templateUrl: './custom-field-stepper.component.html',
  styleUrl: './custom-field-stepper.component.css',

})
export class CustomFieldStepperComponent {

  private _formBuilder = inject(FormBuilder);

  firstFormGroup = this._formBuilder.group({
    fiedName: ['', Validators.required],
    typeControle: ['', Validators.required],
    description: ['', null],

  });
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });
  fields: Field[] = [
    {value: 'String', viewValue: 'Text'},
    {value: 'Number', viewValue: 'Nombre'},
    {value: 'User', viewValue: 'Utilisateur '},
    {value: 'Date', viewValue: 'Date'},
    {value: 'Selection', viewValue: 'Selection'},
    {value: 'CheckBox', viewValue: 'Selection multiple'},
  ];
  isLinear = true;
  issueTypes:IssueType[] = [];
  customField :CustomField | any = {};
  private usingCustomFields: UsingCustomField[] = [];
  options:String[]=[];
  newOption: string ="";
  constructor(private issueService :IssueService,
              private route: ActivatedRoute,
              public activeModal: NgbActiveModal,
  ) {
    this.issueService.issueType$.subscribe(issueTypes => {
      this.issueTypes = issueTypes;
    })
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
    if (this.customField == null || this.customField.allIssueTypes == undefined || this.customField.allIssueTypes.length == 0) {
      return false;
    }
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
      this.save();
    }
  }
  save(){
    this.customField.configDisplay = this.displayOptionSelected;
    this.issueService.saveCustomField(this.customField).subscribe(customField=> {
      this.customField = customField;
      this.options = customField.options;
      this.displayOptionSelected = customField.configDisplay;
      this.issueService.loadAllCustomField();
    })
  }
  protected displayOptionSelected:String[] = [];
  protected readonly dispatchEvent = dispatchEvent;
  protected displayOptions: any [] =CustomFieldComponent.getDisplayOptions();
  fieldType: string;

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
  desabledTypeField(): void {
    const typeIssue = this.firstFormGroup.get('typeControle');
    typeIssue?.disable();
    typeIssue?.clearValidators();

  }

  create() {
    this.issueService.saveCustomField(this.customField).subscribe(customField=> {
       this.customField = customField;
    })
  }
}
