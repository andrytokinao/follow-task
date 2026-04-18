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
import {IssutypeForm2Component} from "../issutype-form2/issutype-form2.component";

@Component({
  standalone:false,
  selector: 'app-new-issue-form',
  templateUrl: './new-issue-form.component.html',
  styleUrls: ['./new-issue-form.component.scss']
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
  protected errorMessage: string;
  @ViewChild('newIssueTypeTrigger') newIssueTypeTrigger!: MatMenuTrigger;
  @ViewChild('issutypeForm') issutypeForm!: IssutypeForm2Component;
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
          this.loadNextKey();
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
        this.loadNextKey();
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


  loadNextKey() {
    this.issueService.getNextKeyParent(this.issueType.id,this.project.id).subscribe(key => {
      this.issueKey = key;
      this.isDesable = false;
    });
  }

  createMaster() {
    this.isDesable = true;
  }

  loadIssueTypeSubtask() {
    this.isDesable = true;
    this.useIssueType = [];
    this.issueType = undefined;
    this.issueKey = '';

    this.issueService.listIssueTypeSubtasks(this.parentIssue.issueType.id).subscribe(types => {
      this.useIssueType = types;
      if (this.useIssueType.length) {
        this.issueType = this.useIssueType[0];
        this.loadNextKey();
      }
    });
  }
  useIssueTypeMaster(defaultType:IssueType | undefined) {
    this.useIssueType = [];
    this.useIssueType = this.issueTypesMasters;
    this.issueType = undefined;
    this.issueKey = '';
    if (defaultType) {
      this.issueType = defaultType;
      this.loadNextKey();
      return;
    }
    if (this.useIssueType && this.useIssueType.length > 0) {
      this.issueType = this.useIssueType[0];
      this.loadNextKey();
      return;
    }
  }

  issueTypesMasters: IssueType[] = [];

  selectProject(event:Event,trigger: MatMenuTrigger,pr: Project) {
    if (event)
      event.stopPropagation();
    this.useIssueType = [];
    this.issueType = undefined;
    this.issueKey = '';
    this.issueService.listIssueTypeMaster(pr.id).subscribe( types => {
      this.useIssueType = types;
      this.project = pr;
      if (this.useIssueType.length) {
        this.issueType = this.useIssueType[0];
        this.loadNextKey();
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
    this.loadNextKey();
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
    if (this.isMaster)
      return false;
    return (this.parentIssue != undefined && this.parentIssue != null)
  }

  onOpen() {
    this.loadNextKey();
  }
  getIssueTypeColor(type: IssueType | null | undefined): string {
    if (!type) return '#aaa';
    if (type.color)
      return type.color.toString();
    const name = (type.name || '').toLowerCase();
    if (name.includes('bug'))                          return '#e74c3c';
    if (name.includes('story'))                        return '#27ae60';
    if (name.includes('tâche') || name.includes('task')) return '#2980b9';
    if (name.includes('epic'))                         return '#8e44ad';
    if (name.includes('sub') || name.includes('sous')) return '#e67e22';
    return '#607d8b';
  }

  getIssueTypeClass(type: IssueType | null | undefined): string {
    if (!type) return '';
    if (type.color)
      return 'type-custom';
    const name = (type.name || '').toLowerCase();
    if (name.includes('bug'))                          return 'type-bug';
    if (name.includes('story'))                        return 'type-story';
    if (name.includes('tâche') || name.includes('task')) return 'type-task';
    if (name.includes('epic'))                         return 'type-epic';
    if (name.includes('sub') || name.includes('sous')) return 'type-sub';
    return '';
  }

  onIssueTypeSaved(issueType:IssueType) {
    this.newIssueTypeTrigger.closeMenu();
    this.menuTrigger.closeMenu();
    this.pushIssueType(issueType);
    this.issueType = issueType;
    this.loadNextKey();
  }

  onMenuIssuetypeOpened() {
    if (this.isMaster) {
      this.issutypeForm.setLevel('PARENT');
      this.issutypeForm.setParent(undefined);
    } else {
      this.issutypeForm.setLevel('SUB_TASK');
      this.issutypeForm.setParent(this.parentIssue.issueType);
    }
  }
  pushIssueType(issueType){
    if (!this.useIssueType)
      this.useIssueType = [];
    this.useIssueType.push(issueType);
  }
  setIsMaster(b: boolean) {
    this.isMaster = b;
  }
}
