import {AfterViewInit, Component, OnInit} from '@angular/core';
import {stripTypename} from "@apollo/client/utilities";
import {MatTableDataSource} from "@angular/material/table";
import {Issue, Project, User} from "../../../../../type/issue";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {
  Filter,
  fromUrlParams,
  IssueSearchCriteriaInput,
  toQueryParams
} from "../../../../../type/issue-search-criteria.util";

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
/*
    { id: 'calendar', icon: 'fas fa-calendar-alt', title: 'Calendrier' }
*/
  ];

  searchCriteria: IssueSearchCriteriaInput | any = {
  };
  fileters:Filter[]=[] ;
  mesTache:Filter ;
  private user: User;
  private selectedFilter: Filter;
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
    this.searchCriteria.issueTypeLevels=['SUB_TASK'];
    this.issueService.searchIssues(this.searchCriteria,this.project.id).subscribe(issues => {
      this.issueService.setIssues(issues);

    })
  }

  ngAfterViewInit() {
    this.route.data.subscribe(data => {
      this.project = data['project'];
      if (this.project && this.project.prefix) {
        this.route.queryParamMap.subscribe((params:ParamMap) => {
          this.searchCriteria = fromUrlParams(params);
  //        this.search();
        });
      }
    });
    this.userService.users$.subscribe((users: any) => {
      // this.users = stripTypename(users);
      this.search();

    });
    this.issueService.project$.subscribe(project=> {
      this.project = project;
    });
    this.route.queryParamMap.subscribe((params:ParamMap) => {
      this.searchCriteria = fromUrlParams(params);
      this.search();
    });
    this.authService.connectedUser$.subscribe(user => {
      this.user = user;
      this.mesTache ={
        name:'Mes taches',
        description:'Tache affecté a moi ',
        user:undefined,
        issueSearchCriteria:{assigneUsernames:[this.user.username]}
      };
     // this.aplayFilter(this.mesTache);
    })

    this.fileters.push({
      name:'Premier filtre',
      description:'Description',
      user:undefined,
      issueSearchCriteria:{}
    });

  }

  ngOnInit(): void {
  }

  changeView(view: string) {
    this.currentView = view;
  }

  loadMySubtask() {

  }

  aplayFilter(filter) {
    this.selectedFilter = filter;
    this.searchIssue(filter.issueSearchCriteria);
  }


  editFilter(filter) {
    this.essueService.editFilter(filter.issueSearchCriteria).subscribe(filter => {
      this.searchIssue(filter);
    })
  }

  searchIssue(searchCriteria:IssueSearchCriteriaInput){
    const queryParams = toQueryParams(searchCriteria);
    this.router.navigate(['../issue'], {
      queryParams ,
      relativeTo: this.route
    });
  }

  isActiveFilter(filter: Filter) {
    if (this.selectedFilter == null)
      return '';
   return (filter.name == this.selectedFilter.name)? "active" : "";
  }
}
