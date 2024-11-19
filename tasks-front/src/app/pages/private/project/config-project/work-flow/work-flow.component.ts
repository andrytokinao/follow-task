import {Component, OnInit} from '@angular/core';
import {Project, WorkFlow} from "../../../../../type/issue";
import {MyCommonModule} from "../../../../../common/common.module";
import {NgForOf} from "@angular/common";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {ActivatedRoute} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueTypeModalComponent} from "../issue-type/issue-type-modal/issue-type-modal.component";
import {PopupWorkFlowComponent} from "./popup-work-flow/popup-work-flow.component";
import {StepperWorkflowComponent} from "./stepper-workflow/stepper-workflow.component";

@Component({
  selector: 'app-work-flow',
  templateUrl: './work-flow.component.html',
  styleUrl: './work-flow.component.css'
})
export class WorkFlowComponent implements OnInit{
  isNewWorkFlow: boolean;
  constructor(private configService:ConfigService,
              private issueService :IssueService,
              private route: ActivatedRoute,
              private modalService:NgbModal

  ) {

  }
  project:Project | any = {};
  newWorkflowName: string;
  workFlow: WorkFlow | any = {};

  editWorkFlow(flow: any) {
    const dialogRef = this.modalService.open(PopupWorkFlowComponent,{windowClass: "xlModal"} );
    dialogRef.componentInstance.workFlow = flow;
    dialogRef.componentInstance.project = this.project;
  }

  newWorkFlow() {
    this.isNewWorkFlow = true;
  }
  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.project = data['project'];
    });
  }
  createWorkFlow() {
    this.isNewWorkFlow = true;
  }

  isSelectedWorkFlow(workFlow: any) {
    return false;
  }

  selectWorkFlow(workFlow: any) {

  }

  saveWorkFlow(name:String,wf:any) {
    let workFlow : any = {};
    workFlow.name = name;
    workFlow.id = wf.id;
    let project : any = {};
    project.id = this.project.id;
    workFlow.project = project;
    this.issueService.saveWorkFlow(workFlow).subscribe( (workFlow)=>{
        this.workFlow = workFlow;
      }
    )

  }
  openStepper(flow: any) {
    const dialogRef = this.modalService.open(StepperWorkflowComponent );
    if (flow != null) {
      dialogRef.componentInstance.loadWorkFlow(flow.id)
    }
    dialogRef.componentInstance.project = this.project;
  }
}
