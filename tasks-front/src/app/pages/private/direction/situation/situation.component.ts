import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {DirectionService} from '../direction.service';
import {heureDe, SituationDirection} from './situation.model';

/**
 * Situation du jour de la direction (DT-005), sur /direction/situation.
 *
 * Trois bandes, dans l'ordre des questions : peut-on croire ce qu'on lit
 * (fiabilité), où en est-on (projets), qui fait quoi maintenant (personnes).
 * Lecture seule. Recalculée par le serveur toutes les 5 minutes et au retour
 * sur l'onglet du navigateur ; l'heure du calcul reste affichée.
 */
@Component({
  standalone: false,
  selector: 'app-direction-situation',
  templateUrl: './situation.component.html',
  styleUrl: './situation.component.css'
})
export class SituationComponent implements OnInit, OnDestroy {

  static readonly ACTUALISATION_MS = 5 * 60 * 1000;

  departements: string[] = [];
  /** null : toute la société. */
  departement: string | null = null;
  situation: SituationDirection | null = null;

  chargement = true;
  erreur = false;
  /** Bande 3 réduite aux personnes sans planning, depuis la bande 1. */
  seulementSansPlanning = false;

  jour = '';
  miseAJour = '';

  private requete?: Subscription;
  private minuterie?: ReturnType<typeof setInterval>;

  constructor(private directionService: DirectionService) {
  }

  ngOnInit(): void {
    this.charger();
    this.minuterie = setInterval(() => this.charger(), SituationComponent.ACTUALISATION_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.minuterie);
    this.requete?.unsubscribe();
  }

  /** Au retour sur l'onglet, la situation a pu changer : on la redemande. */
  @HostListener('document:visibilitychange')
  auRetour(): void {
    if (document.visibilityState === 'visible') {
      this.charger();
    }
  }

  choisir(departement: string | null): void {
    if (departement === this.departement) {
      return;
    }
    this.departement = departement;
    this.seulementSansPlanning = false;
    this.situation = null;
    this.chargement = true;
    this.charger();
  }

  basculerFiltre(): void {
    this.seulementSansPlanning = !this.seulementSansPlanning;
  }

  charger(): void {
    this.requete?.unsubscribe();
    this.requete = this.directionService.situation(this.departement).subscribe({
      next: ({departements, situation}) => {
        this.departements = departements;
        this.situation = situation;
        this.jour = situation ? jourDe(situation.instant) : '';
        this.miseAJour = situation ? heureDe(situation.instant) : '';
        this.chargement = false;
        this.erreur = false;
      },
      // Une situation déjà affichée reste à l'écran, avec son heure : la
      // bannière d'erreur dit qu'elle n'a pas pu être actualisée.
      error: () => {
        this.chargement = false;
        this.erreur = true;
      }
    });
  }
}

/** « vendredi 16 octobre » à partir d'une date-heure ISO du serveur. */
function jourDe(iso: string): string {
  const [annee, mois, jour] = iso.split('T')[0].split('-').map(Number);
  return new Date(annee, mois - 1, jour).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
}
