import {Component, OnInit} from '@angular/core';
import {NgClass} from "@angular/common";
import {stripTypename} from "@apollo/client/utilities";
import {MatTableDataSource} from "@angular/material/table";
import {Issue, Project} from "../../../../../../type/issue";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../../services/issue.service";
import {UserService} from "../../../../../../services/user.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ProjectGuard} from "../../../../../../services/ProjectGuard";
import {ConfirmationDialogService} from "../../../../../../services/confirmation-dialog.service";
import {IssueSearchCriteriaInput} from "../../../../../../type/issue-search-criteria.util";

@Component({
  standalone:false,
  selector: 'app-table-master',
  templateUrl: './table-master.component.html',
  styleUrl: './table-master.component.css'
})
export class TableMasterComponent implements OnInit{
  protected issues: Issue[] =[];
  protected project:Project ;
  protected issueSearche:IssueSearchCriteriaInput;
  constructor(
    private modalService: NgbModal,
    protected issueService: IssueService,
    private essueService: IssueService,
    public userService: UserService,
    private route: ActivatedRoute,
    protected projectGruard:ProjectGuard,
    private router: Router,
    private confirmationDialogService:ConfirmationDialogService
  ) {

  }


  ngOnInit(): void {
    this.essueService.issueMasterList$.subscribe((res: any) => {
      this.issues = stripTypename(res);

    });
    this.issueService.project$.subscribe( project => {
      this.project = project;
    });
    this.issueService.loadIssueMasters(null);
  }

  delete(issue: Issue) {
    this.essueService.deleteIssue(issue.id);
  }
}
