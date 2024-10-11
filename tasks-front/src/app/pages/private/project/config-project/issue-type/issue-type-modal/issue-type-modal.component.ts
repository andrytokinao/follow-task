import {Component, NgIterable, OnInit} from '@angular/core';
import {MatDialogActions, MatDialogContent} from "@angular/material/dialog";
import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {MatCard} from "@angular/material/card";
import {MatFormField} from "@angular/material/form-field";
import {MatToolbar} from "@angular/material/toolbar";
import {FormsModule} from "@angular/forms";
import {MyCommonModule} from "../../../../../../common/common.module";
import {NgForOf, NgIf} from "@angular/common";
import {CustomField, Icone, IssueType, Project, UsingCustomField, WorkFlow} from "../../../../../../type/issue";
import {IssueService} from "../../../../../../services/issue.service";
import {ActivatedRoute} from "@angular/router";
import {MatCheckbox} from "@angular/material/checkbox";
import {CdkDragDrop, moveItemInArray} from "@angular/cdk/drag-drop";
import {supprimerTypename} from "../../../../../../type/graphql.operations";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-issue-type-modal',
  standalone: true,
  imports: [
    MatDialogActions,
    MatTabGroup,
    MatTab,
    MatCard,
    MatFormField,
    MatToolbar,
    MatDialogContent,
    FormsModule,
    MyCommonModule,
    NgForOf,
    NgIf,
    MatCheckbox
  ],
  templateUrl: './issue-type-modal.component.html',
  styleUrl: './issue-type-modal.component.css'
})
export class IssueTypeModalComponent implements OnInit{
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
   constructor(private issueService :IssueService,
               private route: ActivatedRoute,
               public activeModal: NgbActiveModal,
   ) {
   }
  onCancelClick() {
    this.activeModal.close({ project: this.project,issueType:this.issueType });

  }

  onSaveClick() {
     alert("ici ");
    this.activeModal.close({ project: this.project,issueType:this.issueType });
  }

  affectWorkFlow(wf:WorkFlow){
    let project : any = {};
    let workFlow :any ={};
    let issueType :any ={};
    project.id = this.project.id;
    workFlow.id = wf.id;
    issueType.id = this.issueType.id;
    workFlow.project = project;
    issueType.project = project;
    issueType.curentWorkFlow = workFlow;
    this.issueService.affectWorkFlow(issueType).subscribe( (workFlow)=>{
        this.issueType.curentWorkFlow  = workFlow;
      }
    )
  }
  isSelectedWorkFlow(workFlow:any):boolean{
    console.info("is workFlow "+workFlow.id + " current work flow ="+this.workFlow.id);
    if (workFlow == null || workFlow.id == null)
      return false;
    if (this.issueType.curentWorkFlow == null || this.issueType.curentWorkFlow.id == null)
      return false;
    return this.issueType.curentWorkFlow.id == workFlow.id;

  }
  selectWorkFlow(workFlow: any) {
    this.affectWorkFlow(workFlow);
  }

  saveWorkFlow(name:String,wf:any) {
    this.isNewIssueType = false;
    let workFlow : any = {};
    workFlow.name = name;
    workFlow.id = wf.id;
    let project : any = {};
    project.id = this.project.id;
    workFlow.project = project;
    this.issueService.saveWorkFlow(workFlow).subscribe( (workFlow)=>{
        this.affectWorkFlow(workFlow);
      }
    )

  }

  createWorkFlow() {
    this.isNewWorkFlow = true;
  }
  ngOnInit(): void {
 /*   this.route.data.subscribe(data => {
      this.project = data['project'];
      alert(this.project.name);
    });*/
    this.issueService.allCustomField().subscribe(customFields=>{
      this.customFields = customFields;
      this.customFieldsSelected = this.issueType.usingCustomFields;

    })
  }

  selectField(field: CustomField) {
     return false;
  }

  partiallyComplete() {
    return undefined;
  }

  isSelected(field: CustomField) {
   return this.customFieldsSelected.some(selected => selected.customField.id === field.id);

  }
  onCheckboxChange(event: any, field: CustomField) {
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
}
