import {Component, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../../services/issue.service";
import {UserService} from "../../../../../../services/user.service";
import {ActivatedRoute, Router} from "@angular/router";
import {CustomFieldValue, Issue, IssueType, Project, Status, User, WorkFlow} from "../../../../../../type/issue";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {stripTypename} from "@apollo/client/utilities";
import {ViewEditIssueComponent} from "../../../modal/view-edit-issue/view-edit-issue.component";

@Component({
  selector: 'app-issue-master-list',
  templateUrl: './issue-master-list.component.html',
  styleUrl: './issue-master-list.component.css'
})
export class IssueMasterListComponent {
  constructor(
    private modalService: NgbModal,
    protected issueService: IssueService,
    private essueService: IssueService,
    public userService: UserService,
    private route: ActivatedRoute,
    private router: Router
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
    this.isLoading = false;

    this.route.data.subscribe(data => {
      if (this.project && this.project.prefix) {
        this.userService.users$.subscribe((users ) => {
          this.users = stripTypename(users);
        });
      }
    });
    this.issueService.project$.subscribe(project => {
      this.project = project;
      console.debug(project);
      if (this.project) {
      }
    })
  }
  editIssue(issue:Issue){
      this.browsIssueMaster(issue);

  }
  openDialogIssue(issue:Issue){
    const dialogRef = this.modalService.open(ViewEditIssueComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.issue = issue;
    dialogRef.componentInstance.users = this.users;
    dialogRef.result.then((result) => {
      this.currentIssue = null;
    })
  }
  browsIssueMaster(issue:Issue){
    this.issueService.browsIssueMaster(issue);
  }
  editFilter() {
  }
  aplayFilter(){
  }

  isLoading: boolean = true;
  projects = [
    { title: 'Projet 1', description: 'Description du projet 1' },
    { title: 'Projet 2', description: 'Description du projet 2' },
    { title: 'Projet 3', description: 'Description du projet 3' }
  ];
  viewModeField: string = 'chip';

  ngOnInit() {
    // Simule un chargement
    setTimeout(() => {
      this.isLoading = false;
    }, 2000); // Attendre 2 secondes avant de masquer le spinner
    this.essueService.issueMasters$.subscribe((res: any) => {
      this.issues = stripTypename(res);
      this.dataSource =  new MatTableDataSource<Issue>(this.issues);
      this.dataSource.paginator = this.paginator;
      this.isLoading = false;
    });
  }

  saveCustomFieldValue($event: CustomFieldValue) {

  }

  canShowInList(value: CustomFieldValue) {
    if (value == null)
      return false
    if (!(value.values != null || value.string != null || value.text != null || value.user != null || value.numeric != null ||  value.date != null)) {
      return false;
    }
    if (value.customField.configDisplay == null || value.customField.configDisplay.length == 0) {
      return false
    }
    return (value.customField.configDisplay.find(cf =>  cf == 'DisplayInList') != null)
  }
}
