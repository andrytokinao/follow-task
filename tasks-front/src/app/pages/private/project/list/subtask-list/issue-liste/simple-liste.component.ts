import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {
  Criteria, Icone,
  Issue,
  IssueType,
  Project, Repertoire,
  Status,
  User,
  WorkFlow
} from "../../../../../../type/issue";
import _default from "chart.js/dist/plugins/plugin.tooltip";
import type = _default.defaults.animations.numbers.type;
import {stripTypename} from "@apollo/client/utilities";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../../services/issue.service";
import {UserService} from "../../../../../../services/user.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatPaginator, MatPaginatorModule} from "@angular/material/paginator";
import {MyCommonModule} from "../../../../../../common/common.module";
import {ViewEditIssueComponent} from "../../../modal/view-edit-issue/view-edit-issue.component";
import {NgIf} from "@angular/common";
import {AuthService} from "../../../../../../services/auth.service";
import {fromUrlParams, IssueSearchCriteriaInput} from "../../../../../../type/issue-search-criteria.util";

@Component({
  selector: 'app-issue-liste',
  templateUrl: './simple-liste.component.html',
  styleUrl: './simple-liste.component.css'
})
export class SimpleListeComponent implements OnInit{
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

  searchCriteria: IssueSearchCriteriaInput | any = {
  };
  issues: Issue[] = [];
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
  displayedColumns: string[] = ['parrent', 'Titre', 'description', 'issueKey', 'issueType', 'status',"assigne","action"];
  dataSource:MatTableDataSource<Issue> ;

  @ViewChild(MatPaginator) paginator: MatPaginator;


  editIssue(issue:Issue){
    if(issue.issueType.level =="PARENT") {
      this.browsIssue(issue);
    } else {
      this.openDialogIssue(issue);
    }
  }
  ngOnInit(): void {
    this.issueService.issues$.subscribe(data => {
        this.issues = data;
        this.dataSource =  new MatTableDataSource<Issue>(this.issues);
        this.dataSource.paginator = this.paginator;
      });
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
    this.router.navigate(["working/"+this.project.prefix+"/issue/"+issue.issueKey+"/details"])

  }
  editFilter() {
  }
  aplayFilter(){
  }
  search(){

  }
}
