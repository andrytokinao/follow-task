import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {Criteria, Issue, IssueType, Project, Status, User, WorkFlow} from "../../../../type/issue";
import _default from "chart.js/dist/plugins/plugin.tooltip";
import type = _default.defaults.animations.numbers.type;
import {stripTypename} from "@apollo/client/utilities";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../services/issue.service";
import {UserService} from "../../../../services/user.service";
import {ActivatedRoute} from "@angular/router";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatPaginator, MatPaginatorModule} from "@angular/material/paginator";
import {MyCommonModule} from "../../../../common/common.module";

@Component({
  selector: 'app-issue-liste',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MyCommonModule],
  templateUrl: './issue-liste.component.html',
  styleUrl: './issue-liste.component.css'
})
export class IssueListeComponent implements OnInit ,AfterViewInit{
  constructor(
    private modalService: NgbModal,
    private issueService: IssueService,
    private essueService: IssueService,
    public userService: UserService,
    private route: ActivatedRoute
  ) {

  }
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
  displayedColumns: string[] = ['id', 'summary', 'description', 'issueKey', 'issueType', 'status'];
  dataSource:MatTableDataSource<Issue> ;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.route.data.subscribe(data => {
      this.project = data['project'];
      if (this.project && this.project.prefix) {
        this.userService.getUsers(this.project.prefix).subscribe((res: any) => {
          this.users = stripTypename(res.data.allUsers);
        });
        this.essueService.getIssues(this.project.prefix).subscribe((res: any) => {
          this.issues = stripTypename(res.data.allIssue);
          this.dataSource =  new MatTableDataSource<Issue>(this.issues);
          this.dataSource.paginator = this.paginator;

        });
      }
    });
  }
  ngOnInit(): void {

  }

}
