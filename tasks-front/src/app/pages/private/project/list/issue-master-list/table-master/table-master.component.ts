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

  trackByIssue(_index: number, issue: Issue): number | string {
    return issue.id ?? String(issue.issueKey);
  }

  edit(issue: Issue) {
    this.issueService.openEditIssue(issue);
  }

  // La suppression emporte les dossiers et l'historique : elle passe par une
  // confirmation, comme dans la vue liste. Le service était déjà injecté mais
  // n'était pas utilisé ici.
  delete(issue: Issue) {
    this.confirmationDialogService
      .confirm(
        'Suppression de "' + issue.summary + '"',
        'Tous les dossiers et informations seront perdus !!! Voulez-vous supprimer cette demande ?'
      )
      .then(() => this.essueService.deleteIssue(issue.id))
      .catch(() => undefined);
  }
}
