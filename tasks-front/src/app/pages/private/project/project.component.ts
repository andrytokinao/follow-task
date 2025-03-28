import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Route, Router, RouterOutlet} from "@angular/router";
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
import {
  fromBottomEasing,
  fromTopEasing,
  moveFromLeft, rotateGlueFromBottom,
  rotateGlueFromTop
} from "../../../../../projects/router-animations/src/lib/router-animations";
import formatters from "chart.js/dist/core/core.ticks";
import {ProjectBreadcrumbResolverService} from "./project-breadcrumb-resolver.service";
import {MessagesService} from "../../../services/messages.service";

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
      transition('* => end', [
        animate('0.8s 0s ease', keyframes([
          style({ opacity: '0.3', transform: 'translateX(-10%) rotateY(90deg)', offset: 0}),
          style({opacity: '1', transform: 'translateX(0%) rotateY(0deg)', offset: 1 })
        ]))
      ]),
    ]),
    trigger('routeAnimations', [
      transition('* => bottom', useAnimation(rotateGlueFromTop)),
      transition('* => top', useAnimation(rotateGlueFromBottom))
    ]),
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
  private previousOrder: number;
  private projectBreadcrumb: Breadcrumb;

  constructor(
    protected route:ActivatedRoute,
    protected issueService:IssueService,
    protected authGuard:AuthGuard,
    private modalService: NgbModal,
    private router: Router,
    private userService:UserService,
    private breadcrumbService: BreadcrumbService,
    protected projectGuard:ProjectGuard,
    private breadcrumb:ProjectBreadcrumbResolverService,
    private messagesService:MessagesService
  ) {
    this.issueService.loadedWorkspace$.subscribe(value => {
      this.isworkspace = value.valueOf();
    });
    this.route.data.subscribe(data => {
      console.debug(data);
      const breadcrumb: Breadcrumb[] = data['breadcrumb'];
      this.project = data['project'];
      this.previousOrder = data['order']
      /* console.debug(breadcrumb);
       this.breadcrumbService.setBreadcrumbs(breadcrumb);
       this.breadcrumbs = breadcrumb;
       this.breadcrumbService.setBreadcrumbs(breadcrumb);*/
    });
    this.route.data.subscribe(data=> {
      this.previousOrder = data['order'];
      console.log('orrrder ',this.previousOrder);
    })
    this.route.data.subscribe(data => {
      let path = this.route.snapshot.pathFromRoot;
      console.log(path);
    });
    this.issueService.project$.subscribe(project => {
      this.project = project;
      if (this.project) {
        this.userService.loadGroupeUserForProject(this.project.prefix);
      }
    });

    this.issueService.projects$.subscribe(projectes => {
      this.projects = projectes;
    });
    this.breadcrumb.curentBreadcrumb$.subscribe(b => {
      this.projectBreadcrumb = b;
    });
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
    this.router.navigate(["/working/"+project.prefix+"/list/master"])
  }


  triggerAnimation() {
    this.issueService.nextIsLoadingWorkspace( !this.isworkspace);
    if(this.isworkspace)
      this.buttonTriger = "Loeded";
    else
      this.buttonTriger = "Loading";
  }
  getAnimationState(o: any) {
    if (!this.projectBreadcrumb) {
      return '';
    }
    const routeOrder = o.activatedRouteData['order'] ;
    const stat =  routeOrder >= this.projectBreadcrumb.order ? 'top' :'bottom';
    return stat;
  }
}
