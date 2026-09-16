import {Component, OnInit} from '@angular/core';
import {NgClass} from "@angular/common";
import {stripTypename} from "@apollo/client/utilities";
import {MatTableDataSource} from "@angular/material/table";
import {Issue, NotificationApp, Project} from "../../../../../../type/issue";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../../services/issue.service";
import {UserService} from "../../../../../../services/user.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ProjectGuard} from "../../../../../../services/ProjectGuard";
import {ConfirmationDialogService} from "../../../../../../services/confirmation-dialog.service";
import {IssueSearchCriteriaInput} from "../../../../../../type/issue-search-criteria.util";
import {NotificationService} from "../../../../../../services/notification.service";

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
    private confirmationDialogService:ConfirmationDialogService,
    private notificationService: NotificationService
  ) {

  }

  /** Non lues par tâche : une demande porte aussi celles de ses sous-tâches. */
  private nonLuesParTache = new Map<number, NotificationApp[]>();
  private static readonly AUCUNE: NotificationApp[] = [];

  nonLues(issue: Issue): number {
    return this.detailsNonLues(issue).length;
  }

  private detailsNonLues(issue: Issue): NotificationApp[] {
    const id = issue?.id;
    if (id == null) {
      return TableMasterComponent.AUCUNE;
    }
    return this.nonLuesParTache.get(Number(id)) ?? TableMasterComponent.AUCUNE;
  }

  /**
   * Ce qui a changé, au survol de la ligne. Sur cette page on ne voit que les
   * demandes : sans ce détail, une pastille allumée par une sous-tâche
   * n'indiquerait rien de ce qui s'est passé.
   */
  resumeNonLues(issue: Issue): string {
    return this.notificationService.resumeTexte(this.detailsNonLues(issue),
      'Nouveautés sur cette demande et ses sous-tâches :');
  }

  /**
   * Le chevron rouge mène à la liste des tâches filtrée sur la demande : c'est
   * là que se trouve la sous-tâche qui vient d'être assignée, alors que cette
   * page-ci ne montre que les demandes.
   */
  voirLesTaches(issue: Issue, event: Event) {
    event.stopPropagation();
    if (!this.project) {
      return;
    }
    // Filtres ouverts en grand : les valeurs par defaut de la liste (mes
    // taches, statuts non clos) pourraient masquer justement la ligne qu'on
    // vient d'annoncer, et le chevron menerait a une page vide.
    this.router.navigate(['/working', this.project.prefix, 'tasks'],
      {queryParams: {q: issue.issueKey, statut: 'tous', assigne: 'tous', vue: 'table'}});
  }

  ngOnInit(): void {
    this.essueService.issueMasterList$.subscribe((res: any) => {
      this.issues = stripTypename(res);

    });
    this.notificationService.unreadDetailsByIssue$.subscribe(details => {
      this.nonLuesParTache = details;
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
