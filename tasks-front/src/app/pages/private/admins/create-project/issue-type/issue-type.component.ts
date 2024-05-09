import { Component } from '@angular/core';
import {IssueType, Project} from "../../../../../type/issue";
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
  constructor(private configService:ConfigService, private issueService :IssueService) {

  }

  saveIssueType(name:String,issueType:IssueType | any) {
    this.isNewIssueType = false ;
    if(name == issueType.name)
      return;
    if(issueType == null) {
      issueType = {};
    }
    let project :any = {} ;
    project.id = this.project.id;
    issueType.name = name;
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

  select(issueType: any) {
    console.log('select this.'+issueType.name);
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
    console.info("TODO:/ IDI");
    if (issueType == null || issueType.id == null) {
      return false;
    }
    if (this.issueType == null || this.issueType.id == null) {
      return false;
    }

    return this.issueType.id == issueType.id;
  }
  createWorkFlow() {
    this.isNewWorkFlow = true;
  }

}
