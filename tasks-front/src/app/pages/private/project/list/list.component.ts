import {Component, OnInit} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../services/issue.service";
import {UserService} from "../../../../services/user.service";
import {AuthService} from "../../../../services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import {CustomFilter, IssueSearchCriteriaInput, toQueryParams} from "../../../../type/issue-search-criteria.util";
import {BreadcrumbService} from "../../../../services/breadcrumb.service";
import {Breadcrumb, Project} from "../../../../type/issue";
import {filter} from "rxjs";

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent  implements OnInit{
  private project:Project ;
  searchCriteria: IssueSearchCriteriaInput | any = {
  };
  masterFilters: CustomFilter[] = [];
  subtaskFilters: CustomFilter[] = [];
  constructor(
    private modalService: NgbModal,
    private issueService: IssueService,
    private essueService: IssueService,
    public userService: UserService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private breadcrumbService:BreadcrumbService,
  ) {

  }

  aplayMasterFilter(filter) {
    this.searchIssueMaster(filter.criteria);
  }
  searchIssue(searchCriteria:IssueSearchCriteriaInput){
    const queryParams = toQueryParams(searchCriteria);
    this.router.navigate(['search-issue'], {
      queryParams ,
      relativeTo: this.route
    });
  }
  searchIssueMaster(searchCriteria:IssueSearchCriteriaInput){
  /*  const queryParams = toQueryParams(searchCriteria);
    this.router.navigate(['master'], {
      queryParams ,
      relativeTo: this.route
    });*/
    this.issueService.searchIssues(searchCriteria,this.project.id) .subscribe(
      issues => {
        this.issueService.setMasters(issues);
      }
    )
  }
  editFilter(ev,filter) {
    this.essueService.editFilter(ev,filter).subscribe(filter => {
      this.searchIssue(filter);
    })
  }
  loadMySubtask() {
    this.searchCriteria.assigneUsernames = [];
    this.authService.getProfile().subscribe((user: any) => {
      this.searchCriteria.assigneUsernames.push(user.username);
      const queryParams = toQueryParams(this.searchCriteria);
      this.router.navigate(['issue'], {
        queryParams ,
        relativeTo: this.route
      });
    });

  }
  mySubtask(){
    this.loadMySubtask();
  }
  ngOnInit(): void {
    this.issueService.project$.subscribe(project => {this.project = project});
    this.subtaskFilters.push({
      name:'Premier filtre',
      description:'Description',
      user:undefined,
      criteria:{}
    });

    this.issueService.loadMyFilters();
  }


  newSaubaskFilter(event: MouseEvent) {
    let filter:CustomFilter = {
      criteria:{issueTypeLevels:['SUB_TASK']},
      user:this.issueService.user,
      projectId:this.issueService.project.id,
      name:''
    }
    this.issueService.editFilter(event,filter).subscribe(fi=> {
      this.issueService.loadMyFilters();
    })
  }
}
