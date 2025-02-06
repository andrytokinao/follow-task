import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Route, Router} from "@angular/router";
import {IssueService} from "../../../services/issue.service";
import {Breadcrumb, Issue, Project} from "../../../type/issue";
import {AuthGuard} from "../../../services/SystemGuard";
import {NewIssueComponent} from "./modal/new-issue/new-issue.component";
import {stripTypename} from "@apollo/client/utilities";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ViewEditIssueComponent} from "./modal/view-edit-issue/view-edit-issue.component";
import {BreadcrumbService} from "../../../services/breadcrumb.service";
import {UserService} from "../../../services/user.service";
import {ProjectGuard} from "../../../services/ProjectGuard";
import {MatButton} from "@angular/material/button";
import {routeTransition} from "../../../../route-transition";
import {animate, keyframes, state, style, transition, trigger, useAnimation} from "@angular/animations";
import {fromBottomEasing, fromTopEasing,moveFromLeft} from "../../../../../projects/router-animations/src/lib/router-animations";
import formatters from "chart.js/dist/core/core.ticks";

@Component({
  selector: 'app-project',
  standalone: false,
  templateUrl: './project.component.html',
  styleUrl: './project.component.css',
  animations: [

    trigger('workspace', [
      state('start', style({
        transform: 'translateX(0%)'
      })),
      state('end', style({

      })),
      transition('* => *', [
        animate('0.8s 0s ease', keyframes([
          style({ opacity: '0.3', transform: 'translateX(100%) rotateY(-90deg)', offset: 0}),
          style({opacity: '1', transform: 'translateX(0%) rotateY(0deg)', offset: 1 })
        ]))
      ]),
     /* transition('end => start', [
        animate('0.8s 0s ease',  keyframes([
          style({ opacity: '1', transform: ' translateX(0%) rotateY(0deg)', offset: 0 }),
          style({opacity: '0.3', transform: 'translateX(-100%) rotateY(90deg)',offset: 1 })
        ]))
      ])*/
    ])
  ]

})
export class ProjectComponent {
  workSpace='';
  project:Project | undefined;
  private issues: Issue[]=[];
  breadcrumbs: Breadcrumb[] = [];
  openConfig:boolean = false;
  openList:boolean = true;
  projects:Project[]= [];
  isworkspace: Boolean = false;
  protected buttonTriger: string  ='Loading';

  constructor(
    protected route:ActivatedRoute,
    protected issueService:IssueService,
    protected authGuard:AuthGuard,
    private modalService: NgbModal,
    private router: Router,
    private userService:UserService,
    private breadcrumbService: BreadcrumbService,
    protected projectGuard:ProjectGuard

  ) {
    this.issueService.loadedWorkspace$.subscribe(value => {
      this.isworkspace = value.valueOf();
    });
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
      if (this.project) {
        this.userService.loadGroupeUserForProject(this.project.prefix);
      }
    });

    this.issueService.projects$.subscribe(projectes => {
      this.projects = projectes;
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
         this.issueService.reloadMasterList();

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
  selectProject(project: Project) {
    this.workSpace = project.prefix.toString();
    this.project = project;
    this.router.navigate(["/private/working/"+project.prefix+"/list/master"])
  }


  triggerAnimation() {
    this.issueService.nextIsLoadingWorkspace( !this.isworkspace);
    if(this.isworkspace)
      this.buttonTriger = "Loeded";
    else
      this.buttonTriger = "Loading";
  }
}
