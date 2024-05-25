import { Component } from '@angular/core';
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {ConfigEntry, Project, WorkFlow} from "../../../../../type/issue";

@Component({
  selector: 'app-work-flow-status',
  templateUrl: './work-flow-status.component.html',
  styleUrl: './work-flow-status.component.css'
})
export class WorkFlowStatusComponent {
  constructor(private configService: ConfigService, private issueService:IssueService) {

  }
  issueType: any= [];
  configEntry:ConfigEntry | any = {};
  workFlow: WorkFlow | any = {};
  project:Project | any = {};

  create() {
    this.workFlow.active = true;
    this.issueType.curentWorkFlow = this.workFlow;
    this.issueType.project ={};
    this.issueType.project.id = this.project.id;
    this.issueType.project.name = this.project.name;
    alert(JSON.stringify(this.issueType));
    this.issueService.affectWorkFlow(this.issueType).subscribe( (workFlow)=>{
        this.issueType.curentWorkFlow  = workFlow;
      },
      err=>{
        alert("ERROR "+JSON.stringify(err));
      }
    )
  }
}
