import {Component, OnInit} from '@angular/core';
import {Issue} from "../../../../../type/issue";
import {IssueService} from "../../../../../services/issue.service";
import {FichiersIssueService} from "../../../../../common/liste-fichiers/fichiers-issue.service";

type VueSources = 'fichiers' | 'dossiers';

const CLE_VUE = 'sources-files-vue';

/**
 * Page "dossiers sources" de l'issue master. Par défaut, ses fichiers à plat
 * (app-liste-fichiers, gardés en mémoire par issue) ; la vue par dossiers
 * (app-explorateur-fichiers, partagé avec les sous-taches) reste à un clic,
 * pour créer ou supprimer des dossiers. Le choix est retenu.
 */
@Component({
  standalone: false,
  selector: 'app-dossier-source',
  templateUrl: './dossier-source.component.html',
  styleUrls: ['./dossier-source.component.css']
})
export class DossierSourceComponent implements OnInit {
  protected parentIssue: Issue;
  protected vue: VueSources = localStorage.getItem(CLE_VUE) === 'dossiers' ? 'dossiers' : 'fichiers';

  constructor(private issueService: IssueService,
              private fichiersService: FichiersIssueService) {
  }

  ngOnInit(): void {
    this.issueService.issueMaster$.subscribe(issue => this.parentIssue = issue);
  }

  protected choisirVue(vue: VueSources): void {
    // La vue par dossiers a pu changer les fichiers : la liste les redemandera.
    if (this.vue === 'dossiers' && vue === 'fichiers' && this.parentIssue?.id) {
      this.fichiersService.oublier(this.parentIssue.id);
    }
    this.vue = vue;
    localStorage.setItem(CLE_VUE, vue);
  }
}
