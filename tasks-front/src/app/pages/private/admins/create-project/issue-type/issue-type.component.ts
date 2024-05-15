import { Component } from '@angular/core';
import {Icone, IssueType, Project} from "../../../../../type/issue";
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
        alert("error" + JSON.stringify(error));
      }
    );
  }
  saveWorkFlow(name:String,workFlow:any) {
    this.isNewIssueType = false;
    if(name == workFlow.name)
        return;
    workFlow.name = name;
    let issueType : any = {};
    let project : any = {};
    issueType.id = this.issueType.id;
    project.id = this.project.id;
    issueType.curentWorkFlow = workFlow;
    issueType = issueType;
    issueType.project = project;
    workFlow.project = project;
    alert(JSON.stringify(this.issueType));
    this.issueService.affectWorkFlow(issueType).subscribe( (workFlow)=>{
        this.issueType.curentWorkFlow  = workFlow;
      },
      err=>{
        alert("ERROR "+JSON.stringify(err));
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
     if (workFlow == null || workFlow.id == null)
       return false;
    if (this.workFlow == null || this.workFlow.id == null)
      return false;
    return this.workFlow == workFlow.id;

  }
  isSelectedIssueType(issueType:any):boolean{
    if (issueType == null || issueType.id == null || issueType.id == undefined) {
      return false;
    }
    if (this.issueType == null || this.issueType.id == null ||  this.issueType == undefined || this.issueType.id == undefined ) {
      return false;
    }
    console.info("is selected = "+this.issueType.id == issueType.id);
    return this.issueType.id == issueType.id;
  }
  createWorkFlow() {
    this.isNewWorkFlow = true;
  }

  selectWorkFlow(workFlow: any) {
    this.workFlow = workFlow;
  }
}
