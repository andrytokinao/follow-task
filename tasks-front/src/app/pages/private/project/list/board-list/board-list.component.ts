import {Component, Input, OnInit} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {ActivatedRoute} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {AuthGuard} from "../../../../../services/authorization.service.ts";
import {Criteria, Issue, IssueType, Project, Status, User, WorkFlow} from "../../../../../type/issue";
import {NewIssueComponent} from "../../modal/new-issue/new-issue.component";
import {stripTypename} from "@apollo/client/utilities";
import {ViewEditIssueComponent} from "../../modal/view-edit-issue/view-edit-issue.component";
import {IssueSearchCriteriaInput} from "../../../../../type/issue-search-criteria.util";

@Component({
  selector: 'app-board-list',
  templateUrl: './board-list.component.html',
  styleUrl: './board-list.component.css'
})
export class BoardListComponent implements OnInit{
  public issuesBoard: [any, Issue[]][] = [];
  @Input()
  public searchCriteria:IssueSearchCriteriaInput | undefined = undefined;
  public issues: Issue[] = [];
  public users: User[] = [];
  public currentIssue: Issue | null = null;
  workflow: Status[] = [];
  currentWorkflow: WorkFlow | any = {};
  description: string = "";
  summary: string = "";
  nom: any;
  email: any;
  project: Project | undefined;
  issueType: IssueType | any = {};
  private currentWorkflows: WorkFlow[]=[];

  constructor(
    private modalService: NgbModal,
    private issueService: IssueService,
    public userService: UserService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    protected authGuard:AuthGuard
  ) {

  }

  newIssueTest(status: Status) {
    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.componentInstance.status = status;
    dialogRef.componentInstance.project = this.project;
    dialogRef.result.then((result) => {
      this.issues.push(result.issue);
      this.issueService.ajouterAuGroupe(this.issuesBoard, result.issue.status, result.issue);
    }).catch((reason) => {
      console.log('modal cancelled' + reason.message);
    });
  }

  newIssue(status: Status) {
    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.componentInstance.issueTypes = this.currentWorkflow.issueTypes;
    dialogRef.componentInstance.status = status;
    dialogRef.result.then((result) => {
      this.issues = <Issue[]>stripTypename(result.issues)

    })
  }

  canCreate(status: Status): boolean {
    if (status.id === 1)
      return true;
    return true;
  }

  isActive(user: User): boolean {
    if (this.currentIssue != null && this.currentIssue.assigne != null) {
      return this.currentIssue.assigne.id == user.id;
    }
    return false;
  }

  onDragStart($event: DragEvent, issue: Issue) {
    this.currentIssue = issue;
  }

  onDrop($event: DragEvent, status: any) {
    if (this.currentIssue != null) {
      this.currentIssue.status = status;
      this.issueService.saveIssue(this.currentIssue).subscribe({
          next: (result: any) => {
            this.currentIssue = (result.data.saveIssue);
            this.issueService.searchIssues(this.searchCriteria);
          },
          error: (err) => {
            console.error(err)
          }
        }
      );

    }
  }

  onDragOver($event: DragEvent) {
    $event.preventDefault();
  }

  filterByStatus(status: any): Issue[] {
    return this.issues.filter(is => is.status != null && is.status.id == status.id);
  }

  filerWorkFlow(): Status[] {
    // TODO : Filtrer l'affichage de workflow selon le role de l'utilisateur
    let flows: number[] = [0, 1, 2, 3, 4, 5];
    if (this.workflow != null)
      return this.workflow.filter(wf => flows.indexOf(wf.id) != -1);
    return [];
  }

  assign(issue: Issue) {
    this.currentIssue = issue;
  }


  assigneToUser(user: User) {
    if (this.currentIssue != null) {
      this.currentIssue.assigne = user;
      this.issueService.assigneToUser(this.currentIssue,user).subscribe((issue:Issue)=>{
          this.currentIssue = issue;
        }
      );
    }
  }

  submitForm() {

  }

  viewIssue(issue: Issue) {
    const dialogRef = this.modalService.open(ViewEditIssueComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.issue = issue;
    dialogRef.componentInstance.users = this.users;
    dialogRef.result.then((result) => {
      this.currentIssue = null;
    })
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.project = data['project'];
      if (this.project) {
        this.issueService.getIssues(this.project.prefix).subscribe((res: any) => {
        });
        this.issueService.issues$.subscribe(issues => {
          this.currentWorkflows = this.issueService.getDistinctWorkflows(issues);
          if (this.currentWorkflows != null && this.currentWorkflows.length != 0) {
            this.currentWorkflow = this.currentWorkflows[0];
          }
          this.issues = issues;

        });
        this.userService.users$.subscribe(users => {
          this;
          this.users = users;
        });
      }
  })}
  loadByWorkFlow(currentWorkflow:WorkFlow) {
    let criterias: Criteria[] =[];
    for (let type of currentWorkflow.issueTypes){
      let criteria:Criteria | any = {};
      criteria.field ="issueTypeId";
      criteria.value = type.id;
      criteria.operator ="eq";
    }
    this.issueService.issueByCriteria(criterias).subscribe(issues => {
      this.issues = issues;
    });
  }
  getUrlPhoto(user:User){
    return this.userService.getUrlPhoto(user);
  }
}
