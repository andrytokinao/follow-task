import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';
import {of} from 'rxjs';
import {Issue} from '../../../../../type/issue';
import {IssueService} from '../../../../../services/issue.service';
import {IssueApercuPopupService} from '../../../../../common/issue-apercu/issue-apercu-popup.service';

/**
 * Menu « Pièces jointes » d'un projet (issue master) : tous ses fichiers et
 * ceux de ses sous-tâches, à plat (app-liste-fichiers), chacun avec la tâche
 * où il est rangé et qui l'a envoyé. Un fichier déposé ici va à la racine du
 * projet ; son auteur est retenu par le serveur.
 */
@Component({
  standalone: false,
  selector: 'app-pieces-jointes',
  templateUrl: './pieces-jointes.component.html'
})
export class PiecesJointesComponent implements OnInit, OnDestroy {

  protected projet?: Issue;
  /** Sous-tâches du projet : leurs fichiers sont rangés sous leur clé. */
  protected taches: Issue[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly issueService: IssueService,
              private readonly apercuPopup: IssueApercuPopupService) {
  }

  ngOnInit(): void {
    this.issueService.issueMaster$.pipe(
      switchMap(projet => {
        this.projet = projet;
        this.taches = [];
        // La liste s'affiche sans attendre les sous-tâches : elles ne font que nommer la tâche de chaque fichier.
        return projet?.id ? this.issueService.loadSubtask(projet.id) : of([] as Issue[]);
      }),
      takeUntil(this.destroy$)
    ).subscribe(taches => this.taches = taches ?? []);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** La sous-tâche d'un fichier : son aperçu en popup, sans quitter la liste. */
  protected ouvrirTache(tache: Issue): void {
    this.apercuPopup.ouvrir(tache);
  }
}
