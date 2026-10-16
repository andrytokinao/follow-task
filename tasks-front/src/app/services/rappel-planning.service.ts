import {Injectable, NgZone} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {IndividualConfig, ToastrService} from 'ngx-toastr';
import {GraviteRappel, MES_RAPPELS_PLANNING, RappelPlanning} from '../type/rappel-planning';

/** Intervalle entre deux vérifications du planning. */
const INTERVALLE_VERIFICATION = 30 * 60 * 1000;

/**
 * Durée d'affichage par gravité : une alerte (absent) reste jusqu'à ce que
 * l'ouvrier la ferme, une information s'efface d'elle-même.
 */
const AFFICHAGE: Record<GraviteRappel, Partial<IndividualConfig>> = {
  INFO: {timeOut: 10000},
  ATTENTION: {timeOut: 20000},
  ALERTE: {disableTimeOut: true}
};

/**
 * Rappels de planning de l'ouvrier connecté (DT-004).
 *
 * Le serveur dit s'il y a des trous ; ce service les affiche en toast, à la
 * connexion puis toutes les 30 minutes. Un rappel déjà montré (même clé) ne
 * revient pas pendant la session : la clé change dès que le trou change.
 * Les chefs de projet reçoivent une liste vide.
 */
@Injectable({providedIn: 'root'})
export class RappelPlanningService {
  private userId?: string;
  private minuterie?: ReturnType<typeof setInterval>;
  private readonly affiches = new Set<string>();

  constructor(private apollo: Apollo,
              private toastr: ToastrService,
              private zone: NgZone) {
  }

  /** Sans effet si cet utilisateur est déjà suivi. */
  suivre(userId: string): void {
    if (this.userId === userId) {
      return;
    }
    this.arreter();
    this.userId = userId;
    this.verifier();
    // Hors zone Angular : un interval suivi par zone.js garde l'application
    // « instable » et bloque la mise à jour du cache applicatif (voir AppComponent).
    this.zone.runOutsideAngular(() => {
      this.minuterie = setInterval(() => this.zone.run(() => this.verifier()), INTERVALLE_VERIFICATION);
    });
  }

  arreter(): void {
    if (this.minuterie) {
      clearInterval(this.minuterie);
      this.minuterie = undefined;
    }
    this.userId = undefined;
    this.affiches.clear();
  }

  private verifier(): void {
    this.apollo.query<{ mesRappelsPlanning: RappelPlanning[] }>({
      query: MES_RAPPELS_PLANNING,
      fetchPolicy: 'network-only'
    }).subscribe({
      next: res => (res.data?.mesRappelsPlanning ?? []).forEach(r => this.afficher(r)),
      // Un rappel manqué n'empêche pas de travailler : on réessaiera au prochain tour.
      error: err => console.warn('[RAPPEL PLANNING] vérification impossible', err)
    });
  }

  private afficher(rappel: RappelPlanning): void {
    if (this.affiches.has(rappel.cle)) {
      return;
    }
    this.affiches.add(rappel.cle);
    const options = AFFICHAGE[rappel.gravite] ?? AFFICHAGE.INFO;
    switch (rappel.gravite) {
      case 'ALERTE':
        this.toastr.error(rappel.message, rappel.titre, options);
        break;
      case 'ATTENTION':
        this.toastr.warning(rappel.message, rappel.titre, options);
        break;
      default:
        this.toastr.info(rappel.message, rappel.titre, options);
    }
  }
}
