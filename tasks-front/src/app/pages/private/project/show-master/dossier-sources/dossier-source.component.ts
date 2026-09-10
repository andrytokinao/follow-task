import {Component, OnInit} from '@angular/core';
import {Issue} from "../../../../../type/issue";
import {IssueService} from "../../../../../services/issue.service";

/**
 * Page "dossiers sources" de l'issue master : toute la mecanique d'explorateur
 * vit dans app-explorateur-fichiers, partage avec les sous-taches.
 */
@Component({
  standalone: false,
  selector: 'app-dossier-source',
  templateUrl: './dossier-source.component.html'
})
export class DossierSourceComponent implements OnInit {
  protected parentIssue: Issue;

  constructor(private issueService: IssueService) {
  }

  ngOnInit(): void {
    this.issueService.issueMaster$.subscribe(issue => this.parentIssue = issue);
  }
}
