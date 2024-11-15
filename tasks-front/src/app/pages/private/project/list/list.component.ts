import { Component } from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../services/issue.service";
import {UserService} from "../../../../services/user.service";
import {AuthService} from "../../../../services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import {IssueSearchCriteriaInput, toQueryParams} from "../../../../type/issue-search-criteria.util";

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent {
  searchCriteria: IssueSearchCriteriaInput | any = {
  };
  constructor(
    private modalService: NgbModal,
    private issueService: IssueService,
    private essueService: IssueService,
    public userService: UserService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {

  }
  aplayFilter() {
    const queryParams = toQueryParams(this.searchCriteria);
    this.router.navigate(['search-issue'], {
      queryParams ,
      relativeTo: this.route
    });
  }

  editFilter() {
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
}
