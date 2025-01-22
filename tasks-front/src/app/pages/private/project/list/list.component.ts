import {Component, OnInit} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../services/issue.service";
import {UserService} from "../../../../services/user.service";
import {AuthService} from "../../../../services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import {CustomFilter, IssueSearchCriteriaInput, toQueryParams} from "../../../../type/issue-search-criteria.util";
import {BreadcrumbService} from "../../../../services/breadcrumb.service";
import {Breadcrumb, Project} from "../../../../type/issue";

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent  implements OnInit{
  private project:Project ;
  searchCriteria: IssueSearchCriteriaInput | any = {
  };
  fileters:CustomFilter[]=[] ;
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

  aplayFilter(filter) {
    this.searchIssue(filter.issueSearchCriteria);
  }
  searchIssue(searchCriteria:IssueSearchCriteriaInput){
    const queryParams = toQueryParams(searchCriteria);
    this.router.navigate(['search-issue'], {
      queryParams ,
      relativeTo: this.route
    });
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
    this.fileters.push({
      name:'Premier filtre',
      description:'Description',
      user:undefined,
      issueSearchCriteria:{}
    });
  }


}
