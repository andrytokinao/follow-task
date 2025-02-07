import {Component, OnInit} from '@angular/core';
import {ListModule} from "../../list.module";
import {NgForOf, NgIf} from "@angular/common";
import {Issue, Project, User} from "../../../../../../type/issue";
import {
  CustomFilter,
  fromUrlParams,
  IssueSearchCriteriaInput,
  toQueryParams
} from "../../../../../../type/issue-search-criteria.util";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../../services/issue.service";
import {UserService} from "../../../../../../services/user.service";
import {AuthService} from "../../../../../../services/auth.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {NewIssueComponent} from "../../../modal/new-issue/new-issue.component";

@Component({
  selector: 'app-show-master-list',
  templateUrl: './show-master-list.component.html',
  styleUrl: './show-master-list.component.css'
})
export class ShowMasterListComponent implements OnInit{
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
  fileters:CustomFilter[]=[] ;
  mesTache:CustomFilter ;
  private user: User;
  protected selectedFilter: CustomFilter;
  masterFilter:CustomFilter[] = [];
  noFilter:CustomFilter  ={};
  isLoading: boolean = false;

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
        this.noFilter = {
          id:0,
          criteria:{issueTypeLevels:['PARENT']},
          user:this.issueService.user,
          projectId:this.issueService.project.id,
          name:'Tous'
        }

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
          criteria:{assigneUsernames:[this.user?.username || '']}
        };
      }

   //   this.aplayFilter(this.mesTache);
    })

    this.fileters.push({
      name:'Non tesminé',
      description:'Description',
      user:undefined,
      criteria:{
        statusIds:[1,2,3,4]
      }
    });
    this.issueService.loadingListSubtask$.subscribe(isLoading => {
      this.isLoading = isLoading.valueOf();
    });
  }

  ngOnInit(): void {
    this.issueService.masterFilters$.subscribe(filters => {
      this.masterFilter = filters;
    });

  }
  selectFilter(fileter:CustomFilter) {
    this.selectedFilter = fileter;
    this.searchIssueMaster(this.selectedFilter.criteria);
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
  newParentFilter(event: MouseEvent) {
    let filter:CustomFilter = {
      criteria:{issueTypeLevels:['PARENT']},
      user:this.issueService.user,
      projectId:this.issueService.project.id,
      name:''
    }
    this.issueService.editFilter(event,filter).subscribe(fi=> {
      this.issueService.loadMyFilters();
    })
  }
  changeView(view: string) {
    this.currentView = view;
  }

  loadMySubtask() {

  }

  aplayMasterFilter(filter) {
    this.selectedFilter = filter;
    this.searchIssue(filter.criteria);
  }

  editFilter(ev,filter:CustomFilter) {
    this.essueService.editFilter(ev,filter).subscribe(criteria => {
      filter.criteria = criteria;
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

  isActiveFilter(filter: CustomFilter) {
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

  createIssueMaster() {
    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.componentInstance.listIssueTypeMaster(this.project.id);
    dialogRef.componentInstance.project = this.project;
    dialogRef.result.then((result) => {
      this.issues = <Issue[]>(result.issues)
      dialogRef.result.then(res => {
        if (res != null) {
          this.issueService.reloadMasterList();

        }
      })
    })
  }
}
