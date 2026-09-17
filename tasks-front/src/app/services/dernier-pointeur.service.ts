import {Injectable, NgZone} from '@angular/core';

/** Point d'affichage, en coordonnées de la fenêtre. */
export interface PositionMenu {
  x: number;
  y: number;
}

/**
 * Dernier endroit où l'utilisateur a relâché le pointeur.
 *
 * Les menus « à côté du clic » en ont besoin quand l'évènement souris n'est
 * pas disponible : DayPilot ne le transmet pas à onTimeRangeSelected, et une
 * demande relayée par un autre composant (le sélecteur d'issues qui demande
 * une création) arrive sans lui.
 *
 * Un seul écouteur pour toute l'application, en phase de capture pour être
 * lu avant que la cible ne traite le clic, et hors zone Angular : chaque
 * relâchement déclencherait sinon une détection de changements globale.
 */
@Injectable({providedIn: 'root'})
export class DernierPointeurService {

  private dernier?: PositionMenu;

  constructor(zone: NgZone) {
    zone.runOutsideAngular(() =>
      document.addEventListener('pointerup', event => {
        this.dernier = {x: event.clientX, y: event.clientY};
      }, true));
  }

  /**
   * Position explicite si l'appelant en a une, sinon le dernier clic, sinon
   * le haut du centre de l'écran (ouverture au clavier ou par programme).
   */
  resoudre(position?: PositionMenu | MouseEvent): PositionMenu {
    if (position instanceof MouseEvent) {
      return {x: position.clientX, y: position.clientY};
    }
    if (position) {
      return position;
    }
    return this.dernier ?? {x: window.innerWidth / 2, y: window.innerHeight / 3};
  }
}
