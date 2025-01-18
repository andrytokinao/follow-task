import { Component } from '@angular/core';
import {ListModule} from "../../list.module";
import {NgForOf, NgIf} from "@angular/common";
import {Issue, Project, User} from "../../../../../../type/issue";
import {
  Filter,
  fromUrlParams,
  IssueSearchCriteriaInput,
  toQueryParams
} from "../../../../../../type/issue-search-criteria.util";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../../services/issue.service";
import {UserService} from "../../../../../../services/user.service";
import {AuthService} from "../../../../../../services/auth.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";

@Component({
  selector: 'app-show-master-list',
  templateUrl: './show-master-list.component.html',
  styleUrl: './show-master-list.component.css'
})
export class ShowMasterListComponent {
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


  ngAfterViewInit() {
    this.route.data.subscribe(data => {
      this.project = data['project'];
      if (this.project && this.project.prefix) {
        this.route.queryParamMap.subscribe((params:ParamMap) => {
          this.searchCriteria = fromUrlParams(params);
        });
      }
    });
    this.userService.users$.subscribe((users: any) => {
      // this.users = stripTypename(users);
    });
    this.issueService.project$.subscribe(project=> {
      this.project = project;
    if (this.project) {
        this.loadIssueMasters();
      }
    });
    this.route.queryParamMap.subscribe((params:ParamMap) => {
      this.searchCriteria = fromUrlParams(params);

    });
    this.authService.connectedUser$.subscribe(user => {
      this.user = user;
      if (this.user) {
        this.mesTache ={
          name:'Mes taches',
          description:'Tache affecté a moi ',
          user:undefined,
          issueSearchCriteria:{assigneUsernames:[this.user?.username || '']}
        };
      }

   //   this.aplayFilter(this.mesTache);
    })

    this.fileters.push({
      name:'Non tesminé',
      description:'Description',
      user:undefined,
      issueSearchCriteria:{
        statusIds:[1,2,3,4]
      }
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

  editFilter(filter:Filter) {
    this.essueService.editFilter(filter.issueSearchCriteria).subscribe(criteria => {
      filter.issueSearchCriteria = criteria;
      this.searchCriteria = criteria;
      this.searchIssue(criteria);
    })
  }

  searchIssue(searchCriteria:IssueSearchCriteriaInput){
    const queryParams = toQueryParams(searchCriteria);
    this.router.navigate(['../master'], {
      queryParams ,
      relativeTo: this.route
    });
  }

  isActiveFilter(filter: Filter) {
    if (this.selectedFilter == null)
      return '';
    return (filter.name == this.selectedFilter.name)? "active" : "";
  }
  loadIssueMasters(){
    this.searchCriteria.issueTypeLevels=['PARENT'];
    this.searchCriteria.projectId = this.project?.id;
    this.issueService.setIssueMasterCriteria(this.searchCriteria);
    this.issueService.searchIssues(this.searchCriteria,this.project.id).subscribe(masters => {
      this.issueService.setMasters(masters);
    })
  }
}
