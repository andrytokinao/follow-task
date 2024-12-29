import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Route, Router} from "@angular/router";
import {IssueService} from "../../../services/issue.service";
import {Breadcrumb, Issue, Project} from "../../../type/issue";
import {AuthGuard} from "../../../services/authorization.service.ts";
import {NewIssueComponent} from "./modal/new-issue/new-issue.component";
import {stripTypename} from "@apollo/client/utilities";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ViewEditIssueComponent} from "./modal/view-edit-issue/view-edit-issue.component";
import {BreadcrumbService} from "../../../services/breadcrumb.service";

@Component({
  selector: 'app-project',
  standalone: false,
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit{
  project:Project | undefined;
  private issues: Issue[]=[];
  breadcrumbs: Breadcrumb[] = [];
  openConfig:boolean = false;
  openList:boolean = true;

  constructor(
    private route:ActivatedRoute,
    private issueService:IssueService,
    protected authGuard:AuthGuard,
    private modalService: NgbModal,
    private router: Router,
    private breadcrumbService: BreadcrumbService

  ) {
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      console.debug(data);
      const breadcrumb: Breadcrumb[] = data['breadcrumb'];
      this.project = data['project'];
     /* console.debug(breadcrumb);
      this.breadcrumbService.setBreadcrumbs(breadcrumb);
      this.breadcrumbs = breadcrumb;
      this.breadcrumbService.setBreadcrumbs(breadcrumb);*/
    });
    this.route.data.subscribe(data => {

    });
    this.issueService.project$.subscribe(project => {
      this.project = project;
    })
  }
  createMaster() {
    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.componentInstance.listIssueTypeMaster(this.project.id);
    dialogRef.componentInstance.project = this.project;
    dialogRef.result.then((result) => {
      this.issues = <Issue[]>(result.issues)
     dialogRef.result.then(res=> {
       if (res != null) {
           if( res.step == "next") {
             this.issueService.loadIssueMasterByProject(this.project.id);
             this.editIssue(res.issue);
           } else if (res.step == "complete") {
         //  this.router.navigate(['/issue/:res.issue.issueKey]);
             const currentPath = this.route.snapshot.url.map(segment => segment.path);

             this.router.navigate(["/private/working/"+this.project.prefix+" /list/master"]);
           }
       }
     })
    })
  }

  private editIssue(issue) {
    this.issueService.openEditIssue(issue);
  }
  toggleList() {
    this.openList = !this.openList;
  }

  toggleConfig() {
    this.openConfig = !this.openConfig;
  }
}
