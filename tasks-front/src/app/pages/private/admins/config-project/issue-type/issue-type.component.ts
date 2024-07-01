import { Component } from '@angular/core';
import {Icone, Issue, IssueType, Project, Status, WorkFlow} from "../../../../../type/issue";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {supprimerTypename} from "../../../../../type/graphql.operations";

@Component({
  selector: 'app-issue-type',
  templateUrl: './issue-type.component.html',
  styleUrl: './issue-type.component.css'
})
export class IssueTypeComponent {
  test :String = "test okay ";
  issueType: IssueType | any = {};
  newIssueType:IssueType | any = {};
  project:Project | any = {};
  workFlow: any = {};
  action: String = "";
  activeModal: any;
  selected: boolean = false;
  isNewIssueType:boolean = false;
  isNewWorkFlow: boolean = false;
  iconSelected: Icone | undefined ;
  newWorkflowName: string= "";
  isCreateState: boolean=false;
  constructor(private configService:ConfigService, private issueService :IssueService) {

  }

  saveIssueType(issueType:IssueType | any) {
    this.isNewIssueType = false ;
    if(issueType == null) {
      issueType = {};
    }
    let project :any = {} ;
    project.id = this.project.id;
    issueType.project = project;
    this.issueService.saveIssueType(issueType).subscribe(
      (issueTypes: any) => {
        this.project.issueTypes = [];
        this.project.issueTypes = supprimerTypename(issueTypes)
      }, error => {
      }
    );
  }
  saveWorkFlow(name:String,workFlow:any) {
    this.isNewIssueType = false;
    workFlow.name = name;
    let issueType : any = {};
    let project : any = {};
    issueType.id = this.issueType.id;
    project.id = this.project.id;
    issueType.curentWorkFlow = workFlow;
    issueType = issueType;
    issueType.project = project;
    workFlow.project = project;
    this.issueService.affectWorkFlow(issueType).subscribe( (workFlow)=>{
        this.issueType.curentWorkFlow  = workFlow;
      }
    )

  }
  affectWorkFlow(workFlow:WorkFlow){
    let project : any = {};
    project.id = this.project.id;
    project.name = this.project.name;
    project.prefix = this.project.prefix;

    workFlow.project = project;
    this.issueType.curentWorkFlow = workFlow;
    this.issueType.project = project;

    let issueType:IssueType | any = {};
    issueType.id = this.issueType.id;
    issueType.prefix = this.issueType.prefix;
    issueType.name = this.issueType.name;
    issueType.icone = this.issueType.icone;
    issueType.project = project;
    issueType.curentWorkFlow = workFlow;
    this.issueService.affectWorkFlow(issueType).subscribe( (workFlow)=>{
        this.issueType.curentWorkFlow  = workFlow;
      }
    )
  }

  selectIssueType(issueType: any) {
    console.info('select .'+issueType.name);
    this.issueType = issueType;
  }

  createIssueType() {
    this.isNewIssueType = true;
  }

  isSelectedWorkFlow(workFlow:any):boolean{
    console.info("is workFlow "+workFlow.id + " current work flow ="+this.workFlow.id);
     if (workFlow == null || workFlow.id == null)
       return false;
    if (this.issueType.curentWorkFlow == null || this.issueType.curentWorkFlow.id == null)
      return false;
    return this.issueType.curentWorkFlow.id == workFlow.id;

  }
  isSelectedIssueType(issueType:any):boolean{
    if (issueType == null || issueType.id == null || issueType.id == undefined) {
      return false;
    }
    if (this.issueType == null || this.issueType.id == null ||  this.issueType == undefined || this.issueType.id == undefined ) {
      return false;
    }
    return this.issueType.id == issueType.id;
  }
  createWorkFlow() {
    this.isNewWorkFlow = true;
  }

  selectWorkFlow(workFlow: any) {
    this.affectWorkFlow(workFlow);
  }

  createState() {
    this.isCreateState = true;
  }

  addStatus(status: Status) {
    let project:any = {};
    project.id = this.project.id;
    this.issueType.curentWorkFlow.project = project;
    this.issueService.addStatus(status,this.issueType.curentWorkFlow,this.issueType.id).subscribe(
      workFlow=>{
        this.isCreateState = false;
      this.issueType.curentWorkFlow = workFlow;
    }
    )
  }
}
