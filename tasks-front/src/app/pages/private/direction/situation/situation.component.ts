import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {DirectionService} from '../direction.service';
import {heureDe, SituationDirection} from './situation.model';
import {EspaceDirection} from '../direction.model';
import {EspaceDirectionService} from '../espace/espace-direction.service';

/**
 * Situation du jour de la direction (DT-005), sur /direction/TOPO/situation :
 * celle de l'espace de travail choisi dans le menu.
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

  /** Espace de travail du menu ; la situation est la sienne. */
  espace: EspaceDirection | null = null;
  situation: SituationDirection | null = null;

  chargement = true;
  erreur = false;
  /** Bande 3 réduite aux personnes sans planning, depuis la bande 1. */
  seulementSansPlanning = false;

  jour = '';
  miseAJour = '';

  private requete?: Subscription;
  private abonnementEspace?: Subscription;
  private minuterie?: ReturnType<typeof setInterval>;

  constructor(private directionService: DirectionService,
              private espaceService: EspaceDirectionService) {
  }

  ngOnInit(): void {
    this.abonnementEspace = this.espaceService.espace$.subscribe(espace => this.choisir(espace));
    this.minuterie = setInterval(() => this.charger(), SituationComponent.ACTUALISATION_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.minuterie);
    this.requete?.unsubscribe();
    this.abonnementEspace?.unsubscribe();
  }

  /** Au retour sur l'onglet, la situation a pu changer : on la redemande. */
  @HostListener('document:visibilitychange')
  auRetour(): void {
    if (document.visibilityState === 'visible') {
      this.charger();
    }
  }

  private choisir(espace: EspaceDirection): void {
    this.espace = espace;
    this.seulementSansPlanning = false;
    this.situation = null;
    this.chargement = true;
    this.charger();
  }

  basculerFiltre(): void {
    this.seulementSansPlanning = !this.seulementSansPlanning;
  }

  charger(): void {
    if (!this.espace) {
      return;
    }
    this.requete?.unsubscribe();
    this.requete = this.directionService.situation(this.espace.nom).subscribe({
      next: situation => {
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
