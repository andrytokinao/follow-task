import {Component, inject, OnInit} from '@angular/core';
import {MatStep, MatStepper} from "@angular/material/stepper";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormField} from "@angular/material/form-field";
import {CustomField, Icone, IssueType, Project, UsingCustomField, WorkFlow} from "../../../../../../type/issue";
import {supprimerTypename} from "../../../../../../type/graphql.operations";
import {ConfigService} from "../../../../../../services/config.service";
import {IssueService} from "../../../../../../services/issue.service";
import {ActivatedRoute} from "@angular/router";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-issue-type-stepper',

  templateUrl: './issue-type-stepper.component.html',
  styleUrl: './issue-type-stepper.component.css'
})
export class IssueTypeStepperComponent {
  issueTypesParents: IssueType[] = [];
  constructor(private configService:ConfigService,
              protected issueService :IssueService,
              private route: ActivatedRoute,
              public activeModal: NgbActiveModal,

  ) {
      this.issueService.issueTypeParent$.subscribe(parent => {
        this.issueTypesParents = parent ;
      })
  }
  private _formBuilder = inject(FormBuilder);
  creationFormGroupe = this._formBuilder.group({
    typeName: ['', Validators.required],
    prefix: ['', Validators.required],
  });
  levelFormGroup = this._formBuilder.group({
    level: ['', Validators.required],
  });
  isLinear = true;
  issueType: IssueType | any = {};
  newIssueType:IssueType | any = {};
  project:Project | any = {};
  workFlow: any = {};
  action: String = "";
  selected: boolean = false;
  isNewIssueType:boolean = false;
  isNewWorkFlow: boolean = false;
  iconSelected: Icone | undefined ;
  newWorkflowName: string= "";
  isCreateState: boolean=false;
  customFields: CustomField[] = [];
  private customFieldsSelected: UsingCustomField[] = [];
  selectedChildIssueType:IssueType[] = [];
  issueTypes: IssueType[] = [];
  selectedParentIssueType: IssueType;
  desactive: boolean = true;
  workFlows : WorkFlow[]= [];
  selectedWorkflow:WorkFlow ;
  /*CREATION*/
  create() {
    let project :any = {} ;
    project.id = this.project.id;
    this.issueType.project = project;
    this.issueService.saveIssueType(this.issueType).subscribe(
      (issueType) => {
        this.issueType = supprimerTypename(issueType);
        this.loadIssueType();
      }
    );
  }
  selectIcon(icone: any) {
    this.issueType.icone = icone;
  }

  valideCreation() {
    return this.creationFormGroupe.valid && this.issueType.icone != null;
  }
/*
 Niveau
 */

  loadIssueType(){
    this.issueService.getIssueTypeById(this.issueType.id).subscribe(issueType => {
     if (issueType.curentWorkFlow != null )
      this.selectedWorkflowId = issueType.curentWorkFlow.id;

      this.issueType = issueType;
      if (this.issueType.parent != undefined) {
        this.selectedParentIssueType = this.issueType.parent;
      }
      this.selectedChildIssueType = this.issueType.children;
     this.selectedWorkflow = this.issueType.curentWorkFlow;
    }, error => {
      this.selectedWorkflowId = undefined;
    })
  }
  save() {
    this.issueService.saveIssueType(this.issueType).subscribe(res=>{
      this.issueType = res;
      this.loadIssueType();
    })
  }
  addParrent(parent){
    this.issueService.affectIssueTypeForParent(this.issueType.id,parent.id)
      .subscribe(ist =>{
        this.loadIssueType();
      })
  }
  getFilteredParentOptions() {
    return this.getFilteredChildrenOptions().filter(type => !this.checkedChildren(type));
  }
  getFilteredChildrenOptions() {
    if (!this.issueTypes)
      return [];
    return this.issueTypes.filter(type=>this.issueType.id != type.id );
  }
  checkChildren(event: any, issueType: IssueType) {
    if( event.checked){
      this.addAsChild(issueType);
    } else {
      this.removeChild(issueType);
    }
    this.getFilteredParentOptions();
  }
  checkedChildren(type:IssueType){
    return this.selectedChildIssueType.some(selected => selected.id=== type.id);
  };

  addAsChild(issueType:IssueType){
    this.issueService.affectIssueTypeForParent(issueType.id,this.issueType.id)
      .subscribe(it =>{
        this.loadIssueType();
      })
  }
  removeChild(issueType:IssueType){
    this.issueService.removeIssueTypeParent(issueType.id)
      .subscribe(it =>{
        this.loadIssueType();
      })
  }

/*
  CUSTOM FIELD
*/
  isSelectedField(field: CustomField) {
    if (this.customFieldsSelected == undefined)
      return false;
    return this.customFieldsSelected.some(selected => selected.customField.id === field.id);
  }
  partiallyComplete() {
    return undefined;
  }
  onCheckboxChangeField(event: any, field: CustomField) {
    if (event.checked) {
      this.useCustomField(field);
    } else {
      this.unUse(field);
    }
  }
  useCustomField(cf:any){
    const usingCustomField : UsingCustomField | any = {};
    const issueType : IssueType | any = {};

    const customField: CustomField | any = {};
    customField.id = cf.id;

    customField.name = cf.name;
    issueType.id = this.issueType.id
    usingCustomField.customField = customField;
    usingCustomField.issueType = issueType;
    this.issueService.useCustomField(usingCustomField).subscribe((result)=> {
      this.issueType.usingCustomFields = result;
      this.customFieldsSelected = this.issueType.usingCustomFields;
    })
  }
  unUse(cf :any) {
    const usingCustomField : UsingCustomField | any = {};
    const issueType : IssueType | any = {};
    const customField: CustomField | any = {};
    customField.id = cf.id;
    customField.name = cf.name;
    issueType.id = this.issueType.id
    usingCustomField.customField = customField;
    usingCustomField.issueType = issueType;
    this.issueService.unUseCustomField(usingCustomField).subscribe((result)=> {
      this.issueType.usingCustomFields = result;
      this.customFieldsSelected = this.issueType.usingCustomFields;

    })
  }
  loadAllCustomField(){
    this.issueService.allCustomField$.subscribe(customFields=>{
      this.customFields = customFields;
      this.customFieldsSelected = this.issueType.usingCustomFields;

    });
  }
  loadWorkFlows(){
    this.issueService.workFlowsByProject(this.project.id).subscribe(workFlows=>{
      this.workFlows = workFlows;

    });
  }
  affectWorkFlow(wf:WorkFlow){
    let project : any = {};
    project.id = this.project.id;
    project.name = this.project.name;
    project.prefix = this.project.prefix;

    wf.project = project;
    this.issueType.project = project;

    let issueType:IssueType | any = {...this.issueType};
    issueType.curentWorkFlow = wf;
    this.issueService.affectWorkFlow(issueType).subscribe( (workFlow)=>{
        this.loadIssueType();
      } , error => {
       this.selectedWorkflow = undefined;
      },

    )
  }
  checkedWorkflowsMap: { [key: number]: boolean } = {};
  private updateCheckedWorkflows(): void {
    this.checkedWorkflowsMap = {};
    this.workFlows.forEach(wf => {
    //  this.checkedWorkflowsMap[wf.id] = this.workFlowIsChecked(wf);
    });
  }
  workFlowIsChecked(wf: any): boolean {
    return this.selectedWorkflow?.id === wf.id;
  }
  protected readonly alert = alert;
  selectedWorkflowId: Number;
  onSaveClick() {
    this.activeModal.close({ project: this.project,issueType:this.issueType });
  }

}
