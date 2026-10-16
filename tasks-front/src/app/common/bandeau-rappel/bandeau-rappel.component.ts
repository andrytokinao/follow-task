import {Component} from '@angular/core';
import {AsyncPipe, NgIf} from '@angular/common';
import {RouterLink} from '@angular/router';
import {combineLatest, map, Observable} from 'rxjs';
import {RappelPlanningService} from '../../services/rappel-planning.service';
import {IssueService} from '../../services/issue.service';
import {RappelPlanning} from '../../type/rappel-planning';

interface Bandeau {
  rappel: RappelPlanning;
  /** Planning de l'espace en cours, à défaut du premier espace de l'ouvrier. */
  lien: string;
}

/**
 * Bandeau des rappels persistants (DT-006) : « aucune activité planifiée
 * aujourd'hui ». Pas de bouton de fermeture : il disparaît de lui-même dès que
 * le serveur ne renvoie plus le rappel, c'est-à-dire à la première activité.
 *
 * Ancré en bas à gauche (le chrono occupe le bas à droite) : en haut, il
 * masquerait l'en-tête propre à chaque page.
 */
@Component({
  selector: 'app-bandeau-rappel',
  standalone: true,
  imports: [NgIf, AsyncPipe, RouterLink],
  templateUrl: './bandeau-rappel.component.html',
  styleUrl: './bandeau-rappel.component.css'
})
export class BandeauRappelComponent {

  readonly bandeau$: Observable<Bandeau | null>;

  constructor(rappelPlanningService: RappelPlanningService, issueService: IssueService) {
    this.bandeau$ = combineLatest([
      rappelPlanningService.bandeau$,
      issueService.project$,
      issueService.projects$
    ]).pipe(
      map(([rappel, projet, projets]) => {
        if (!rappel) {
          return null;
        }
        const prefixe = projet?.prefix ?? projets?.[0]?.prefix;
        return {rappel, lien: prefixe ? `/working/${prefixe}/planning` : '/working'};
      })
    );
  }
}
