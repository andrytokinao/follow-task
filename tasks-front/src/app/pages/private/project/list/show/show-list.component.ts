import {AfterViewInit, Component, OnInit} from '@angular/core';
import {stripTypename} from "@apollo/client/utilities";
import {MatTableDataSource} from "@angular/material/table";
import {Issue, Project} from "../../../../../type/issue";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {fromUrlParams, IssueSearchCriteriaInput} from "../../../../../type/issue-search-criteria.util";

@Component({
  selector: 'app-show',
  templateUrl: './show-list.component.html',
  styleUrl: './show-list.component.css'
})
export class ShowListComponent implements OnInit, AfterViewInit{
  issues:Issue[] =[];
  project: Project | undefined;
  currentView: string = 'list';
  views = [
    { id: 'list', icon: 'fas fa-list', title: 'Liste de tâches' },
    { id: 'board', icon: 'fas fa-columns', title: 'Kanban' },
    { id: 'calendar', icon: 'fas fa-calendar-alt', title: 'Calendrier' }
  ];

  searchCriteria: IssueSearchCriteriaInput | any = {
  };
  constructor(
    private modalService: NgbModal,
    protected issueService: IssueService,
    private essueService: IssueService,
    public userService: UserService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {

  }
  search(){
    this.issueService.searchIssues(this.searchCriteria).subscribe(issues => {
   //   this.issues = stripTypename(issues);

    })
  }

  ngAfterViewInit() {
    this.route.data.subscribe(data => {
      this.project = data['project'];
      if (this.project && this.project.prefix) {
        this.route.queryParamMap.subscribe((params:ParamMap) => {
          this.searchCriteria = fromUrlParams(params);
          this.search();
        });
      }
    });
    this.userService.users$.subscribe((users: any) => {
      // this.users = stripTypename(users);
    });
  }

  ngOnInit(): void {
  }

  changeView(view: string) {
    this.currentView = view;
  }
}
