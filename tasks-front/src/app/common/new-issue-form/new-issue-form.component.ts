import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Injector,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Issue, IssueType, Project, Status } from '../../type/issue';
import { IssueService } from '../../services/issue.service';
import {MessagesService} from "../../services/messages.service";
import {MatMenuTrigger} from "@angular/material/menu";
import {ALL_EVENT_TYPE} from "../../type/graphql.operations";

@Component({
  standalone:false,
  selector: 'app-new-issue-form',
  templateUrl: './new-issue-form.component.html',
  styleUrls: ['./new-issue-form.component.css']
})
export class NewIssueFormComponent implements OnInit, AfterViewInit{
  issueKey: String = '';
  summary: string = '';
  saving = false;
  description: string = '';
  issueType: IssueType | any = {};
  status: Status | null = null;
  project: Project | undefined;
  allIssueTypes: IssueType[] = [];
  useIssueType: IssueType[] = [];
  projects:Project [] = [];
  @Input() parentIssue: Issue | undefined;
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  @Output() saved = new EventEmitter<void>();
  step: string = '';
  @Input() isMaster = true;
  isDesable = false;
  private toClose: boolean;


  @ViewChild('autosize') autosize: CdkTextareaAutosize | undefined;
  private _injector = inject(Injector);
  private errorMessage: string;

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
       this.selectProject(undefined,undefined,this.projects[0]);
      }
    });
    this.issueService.issueMaster$.subscribe(issue => {
      this.parentIssue = issue;
      if (this.parentIssue?.id) {
        if (!this.isMaster) {
          this.loadIssueTypeSubtask();
        }
      } else {

      }

    })

  }

  save(form: any) {
    this.errorMessage = undefined;
    if (form.invalid) return;
    this.saving = true;
    const issue: any = {
      summary: this.summary,
      description: this.description,
      issueKey: this.issueKey,
      issueType: this.issueType,
      project: { id: this.project?.id }
    };

    if (this.parentIssue) {
      issue.parent = { id: this.parentIssue.id };
    }

    this.issueService.saveIssue(issue).subscribe({
      next: (res) => {
        this.saving = false;
        this.messageService.showRight('');
        this.saved.emit();
        this.summary = '';
        this.description = '';
        this.loadNextKey(this.issueType.id);
      },
      error: (err:Error) => {
        console.log(err);
        this.saving = false;
        this.errorMessage = 'Error survenu lors de la creation '+JSON.stringify(err);
      }
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

  loadIssueTypeSubtask() {
    this.isDesable = true;
    this.issueService.listIssueTypeSubtasks(this.parentIssue.issueType.id).subscribe(types => {
      this.useIssueType = types;
      if (this.useIssueType.length) {
        this.issueType = this.useIssueType[0];
        this.loadNextKey(this.issueType.id);
      }
    });
  }

  issueTypesMasters: IssueType[] = [];

  selectProject(event:Event,trigger: MatMenuTrigger,pr: Project) {
    if (event)
      event.stopPropagation();

    this.issueService.listIssueTypeMaster(pr.id).subscribe( types => {
      this.useIssueType = types;
      this.project = pr;
      if (this.useIssueType.length) {
        this.issueType = this.useIssueType[0];
        this.loadNextKey(this.issueType.id);
      }
    });
    if (trigger)
      trigger.closeMenu();
  }

  canCreate(){
    if (!this.project || !this.issueType || !this.issueKey || !this.summary){
      return false;
    }

    return !this.saving;
  }
  selectIssueType(event:Event,trigger: MatMenuTrigger,type: IssueType) {
    if (event)
      event.stopPropagation();
    this.issueType = type;
    this.loadNextKey(this.issueType.id);
    if (trigger)
      trigger.closeMenu();
  }

  clickMenu($event: MouseEvent) {
    if (!this.toClose) {
      $event.stopPropagation();
    } else {
      this.toClose = false;
    }
  }
  ngAfterViewInit(): void {
    this.toClose = false;


  }
  isSubtask(){
    return (this.parentIssue != undefined && this.parentIssue != null)
  }

  onOpen() {
    this.loadNextKey(this.issueType.id);
  }
}
