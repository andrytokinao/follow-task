import {Component, inject, Injector, OnInit, ViewChild} from '@angular/core';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Issue, IssueType, Project, Status } from '../../type/issue';
import { IssueService } from '../../services/issue.service';
import {MessagesService} from "../../services/messages.service";

@Component({
  standalone:false,
  selector: 'app-new-issue-form',
  templateUrl: './new-issue-form.component.html',
  styleUrls: ['./new-issue-form.component.css']
})
export class NewIssueFormComponent implements OnInit{
  issueKey: String = '';
  summary: string = '';
  description: string = '';
  issueType: IssueType | any = {};
  status: Status | null = null;
  project: Project | undefined;
  allIssueTypes: IssueType[] = [];
  useIssueType: IssueType[] = [];
  projects:Project [] = [];
  parent: Issue | undefined;
  step: string = '';
  isMaster = true;
  isDesable = false;

  @ViewChild('autosize') autosize: CdkTextareaAutosize | undefined;
  private _injector = inject(Injector);

  constructor(public issueService: IssueService,
    protected messageService :MessagesService
  ) {}

  ngOnInit(): void {
    this.issueService.issueTypeParent$.subscribe(issueTypes => {
      this.issueTypesMasters = issueTypes;
      if (this.isMaster) {
        this.useIssueType = this.issueTypesMasters;
      }
      this.allIssueTypes = issueTypes;
    });

    this.issueService.issueType$.subscribe(types => {
      this.allIssueTypes = types;
    });

    this.issueService.project$.subscribe(project => {
      this.project = project;
    });
    this.issueService.issueTypeMasters$.subscribe(itm => {
      if (itm) {
        this.issueTypesMasters = itm;
        if (itm.length > 0) {
          this.issueType = itm[0];
          this.loadNextKey(this.issueType.id);
        }
      }
    });
    this.issueService.allProjects().subscribe(projects=> {
      this.projects = projects;
      if (this.project == null ){
        if( this.projects && this.projects.length>0)
       this.selectProject(this.projects[0]);
      }
    })
  }

  save(form: any) {
    if (form.invalid) return;

    const issue: any = {
      summary: this.summary,
      description: this.description,
      issueKey: this.issueKey,
      issueType: this.issueType,
      project: { id: this.project?.id }
    };

    if (this.parent) {
      issue.parent = { id: this.parent.id };
    }

    this.issueService.saveIssue(issue).subscribe(res => {
      this.messageService.showRight('');
      console.log('Issue créée :', res);
    });
  }

  next() {
    this.step = 'next';
    this.save({});
  }

  complete() {
    this.step = 'complete';
    this.save({});
  }

  cancel() {
   this.messageService.showRight('');
  }


  loadNextKey(issueTypeId: number) {
    this.issueService.getNextKey(issueTypeId).subscribe(key => {
      this.issueKey = key;
      this.isDesable = false;
    });
  }

  createMaster() {
    this.isDesable = true;
  }

  listIssueTypeSubtasks(masterId: number) {
    this.isDesable = true;
    this.issueService.listIssueTypeSubtasks(masterId).subscribe(types => {
      this.useIssueType = types;
      if (this.allIssueTypes.length) {
        this.issueType = this.allIssueTypes[0];
        this.loadNextKey(this.issueType.id);
      }
    });
  }

  issueTypesMasters: IssueType[] = [];

  selectProject(pr: Project) {
    this.issueService.listIssueTypeMaster(pr.id).subscribe( types => {
      this.useIssueType = types;
      this.project = pr;
      if (this.useIssueType.length) {
        this.issueType = this.useIssueType[0];
        this.loadNextKey(this.issueType.id);
      }
    });
  }

  canCreate(){
    if (!this.project || !this.issueType || !this.issueKey || !this.summary){
      return false;
    }
    return true;
  }
  selectIssueType(type: IssueType) {
    this.issueType = type;
    this.loadNextKey(this.issueType.id);
  }
}
