import {Component, inject, Inject, Injector, Input, ViewChild, afterNextRender, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import {Issue, IssueType, Project, Status} from "../../../../../type/issue";
import {IssueService} from "../../../../../services/issue.service";
import {CdkTextareaAutosize} from "@angular/cdk/text-field";
import {JsonpInterceptor} from "@angular/common/http";
@Component({
  selector: 'app-edit-issue',
  templateUrl: './new-issue.component.html',
  styleUrl: './new-issue.component.css'
})
export class NewIssueComponent implements OnInit{
  issue : any = {
    summary:"Test test  ",
    description :"description ",
  };
  isMaster=false;
  parent:Issue | undefined;
  issueTypesMasters:IssueType[]=[];
  step:string ="";
  status : Status|null = null ;
  summary: string = '';
  description: string = '';
  type: string = '';
  issueKey:String ="";
  issueType: IssueType | any = {};
  allIssueTypes: IssueType[] = [];
  useIssueType:IssueType [] = [];
  project:Project | undefined;
  protected  isDesable = false;

  @ViewChild('autosize') autosize: CdkTextareaAutosize | undefined;
  private _injector = inject(Injector);
  constructor(
    public activeModal: NgbActiveModal,
    public issueService:IssueService,
  ) {}

  save() {
    let issue:any = {};
    let project :any ={};
    let status :any ={};
    let issueType : any = {};
    status.id = this.status?.id;
    issue.summary = this.summary;
    issue.description = this.description;
    issue.issueKey = this.issueKey;
     project.id = this.project?.id;
     issueType.project = project;

    issue.issueType = this.issueType;
    if(this.parent) {
      let parent:any = {id:this.parent.id}
      issue.parent = parent;
    }
    issue.status = this.status;
      this.issueService.saveIssue(issue).subscribe((res:any)=>{
        this.activeModal.close({ issue: res,step :this.step });
      });
    }
   next(){
     this.step = "next";
     this.save();
   }
  complete(){
    this.step = "complete";
    this.save();
  }
  cancel() {
    this.activeModal.close(null);
  }

  change() {
    console.log(JSON.stringify(this.issueType));
  }
  public createMaster(){
    this.isDesable = true;
  }
  public listIssueTypeSubtasks(masterId:Number){
    this.isDesable = true;

    this.issueService.listIssueTypeSubtasks(masterId).subscribe(types=>{
      this.useIssueType = types;
      if (this.allIssueTypes != null && this.allIssueTypes.length != 0) {
        this.issueType = this.allIssueTypes[0];
        this.loadNextKey(this.issueType.id);
      }
    });
  }
  public loadNextKey(issueTypeId:Number){
    this.issueService.getNextKey(issueTypeId).subscribe(key => {
      this.issueKey = key;
    this.isDesable = false;

    });
  }

  changeType() {
    this.isDesable = true;
    this.loadNextKey(this.issueType.id);
  }

  ngOnInit(): void {
    this.issueService.issueTypeParent$.subscribe(issueTypesm =>  {
      this.issueTypesMasters = issueTypesm;
      if(this.isMaster){
        this.useIssueType = this.issueTypesMasters;
      }
      this.allIssueTypes = issueTypesm;
    });
    this.issueService.issueType$.subscribe(issueTypes =>  {
      this.allIssueTypes = issueTypes;
    });
    this.issueService.project$.subscribe(project=>{
      this.project = project;
    })
  }
}
