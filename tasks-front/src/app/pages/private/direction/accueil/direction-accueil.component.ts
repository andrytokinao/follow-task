import {Component, OnInit} from '@angular/core';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {DirectionService} from '../direction.service';
import {EspaceDirectionService} from '../espace/espace-direction.service';
import {heureDe, SituationDirection} from '../situation/situation.model';
import {LigneProjet, lignesProjets, SyntheseEspace, synthetiserParEspace} from './accueil.model';

/**
 * Accueil du cockpit de direction (`/direction`) : tableau de bord de tous les
 * projets en cours, tous espaces de travail confondus.
 *
 * Les quatre chiffres et la liste « À traiter » sont ceux de la situation du
 * jour (DT-005) calculée pour toute la société ; viennent ensuite la synthèse
 * par espace et la liste de tous les projets. Chaque espace, chaque projet
 * mène à ses fiches (`/direction/TOPO`).
 */
@Component({
  standalone: false,
  selector: 'app-direction-accueil',
  templateUrl: './direction-accueil.component.html',
  styleUrl: './direction-accueil.component.css'
})
export class DirectionAccueilComponent implements OnInit {

  chargement = true;
  erreur = false;

  situation: SituationDirection | null = null;
  miseAJour = '';
  espaces: SyntheseEspace[] = [];
  projets: LigneProjet[] = [];

  constructor(private directionService: DirectionService,
              private espaceService: EspaceDirectionService) {
  }

  ngOnInit(): void {
    forkJoin({
      espaces: this.espaceService.espaces(),
      projets: this.directionService.projets(null),
      // Sans la situation, les tableaux restent utiles.
      situation: this.directionService.situation(null).pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({espaces, projets, situation}) => {
        this.situation = situation;
        this.miseAJour = situation ? heureDe(situation.instant) : '';
        this.espaces = synthetiserParEspace(espaces, projets);
        this.projets = lignesProjets(espaces, projets);
        this.chargement = false;
      },
      error: () => {
        this.chargement = false;
        this.erreur = true;
      }
    });
  }

  initiale(prefixe: string | null | undefined): string {
    return (prefixe ?? '?').charAt(0).toUpperCase();
  }

  parEspace(_: number, s: SyntheseEspace): string {
    return s.espace.prefixe;
  }

  parProjet(_: number, l: LigneProjet): number {
    return l.projet.id;
  }
}
