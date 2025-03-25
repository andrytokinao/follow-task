import {Component, inject} from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {Project, Status, WorkFlow} from "../../../../../../type/issue";
import {IssueService} from "../../../../../../services/issue.service";
import {ActivatedRoute} from "@angular/router";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-stepper-workflow',
  standalone: false,
  templateUrl: './stepper-workflow.component.html',
  styleUrl: './stepper-workflow.component.css'
})
export class StepperWorkflowComponent {
  project:Project | any = {};
  workFlow:WorkFlow | any = {};
  statuses:Status[]=[];
  isCreateState: boolean;
  iconSelected: any;
  constructor(private issueService :IssueService,
              private route: ActivatedRoute,
              public activeModal: NgbActiveModal,
  ) {
  }
  private _formBuilder = inject(FormBuilder);

  firstFormGroup = this._formBuilder.group({
    nameCtrl: ['', Validators.required],
  });
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });
  isLinear = true;

  setIcone($event: any) {
  }

  addStatus(status: Status) {
    this.isCreateState = false;
    let project:any = {};
    project.id = this.project.id;
    this.workFlow.project = project;
    this.issueService.addStatus(status,this.workFlow,null).subscribe(
      workFlow=>{
        this.workFlow = workFlow;
        this.statuses = this.workFlow.statuses;
        this.isCreateState = false;
      }
    )
  }

  save() {
    let project : any = {};
    project.id = this.project.id;
    this.workFlow.project = project;
    this.issueService.saveWorkFlow(this.workFlow).subscribe( (workFlow)=> {
      this.workFlow = workFlow ;
      this.statuses = this.workFlow.statuses;

    });
  }
  loadWorkFlow(workFlowId:Number) {
    this.issueService.getWorkFlow(workFlowId).subscribe( (workFlow)=> {
      this.workFlow = { ...workFlow };
      this.statuses = [...this.workFlow.statuses];

    });
  }
  public createState(){
    this.isCreateState = true;
  }

  onSaveClick() {
    this.activeModal.close({ workFlow:this.workFlow });
  }
}
