import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {
  Criteria,
  Issue,
  IssueType,
  Project,
  Status,
  User,
  WorkFlow
} from "../../../../../type/issue";
import _default from "chart.js/dist/plugins/plugin.tooltip";
import type = _default.defaults.animations.numbers.type;
import {stripTypename} from "@apollo/client/utilities";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatPaginator, MatPaginatorModule} from "@angular/material/paginator";
import {MyCommonModule} from "../../../../../common/common.module";
import {ViewEditIssueComponent} from "../../modal/view-edit-issue/view-edit-issue.component";
import {NgIf} from "@angular/common";
import {AuthService} from "../../../../../services/auth.service";
import {fromUrlParams, IssueSearchCriteriaInput} from "../../../../../type/issue-search-criteria.util";

@Component({
  selector: 'app-issue-liste',
  templateUrl: './issue-liste.component.html',
  styleUrl: './issue-liste.component.css'
})
export class IssueListeComponent implements OnInit ,AfterViewInit{
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
  searchCriteria: IssueSearchCriteriaInput | any = {
  };
  public issues: Issue[] = [];
  public users: User[] = [];
  public currentIssue: Issue | null = null;
  workflow: Status[] = [];
  currentWorkflow: WorkFlow | any = {};
  description: string = "";
  summary: string = "";
  nom: any;
  email: any;
  project: Project | undefined;
  issueType: IssueType | any = {};
  displayedColumns: string[] = ['id', 'summary', 'description', 'issueKey', 'issueType', 'status',"assigne"];
  dataSource:MatTableDataSource<Issue> ;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.route.data.subscribe(data => {
      this.project = data['project'];
      if (this.project && this.project.prefix) {
        this.userService.getUsers(this.project.prefix).subscribe((res: any) => {
          this.users = stripTypename(res.data.allUsers);
        });
       // this.loadMySubtask();

        this.route.queryParamMap.subscribe((params:ParamMap) => {
          this.searchCriteria = fromUrlParams(params);
          this.search();
        });
      }
    });
  }
  editIssue(issue:Issue){
    if(issue.issueType.level =="PARENT") {
      this.browsIssue(issue);
    } else {
      this.openDialogIssue(issue);
    }
  }
  ngOnInit(): void {

  }
  openDialogIssue(issue:Issue){
    const dialogRef = this.modalService.open(ViewEditIssueComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.issue = issue;
    dialogRef.componentInstance.users = this.users;
    dialogRef.result.then((result) => {
      this.currentIssue = null;
    })
  }
  browsIssue(issue:Issue){
    this.router.navigate(["private/working/"+this.project.prefix+"/issue/"+issue.issueKey+"/details"])

  }
  editFilter() {
  }
  aplayFilter(){
  }

  search(){
    this.issueService.searchIssues(this.searchCriteria).subscribe(issues => {
      this.issues = stripTypename(issues);
      this.dataSource =  new MatTableDataSource<Issue>(this.issues);
      this.dataSource.paginator = this.paginator;
    })
  }
}
