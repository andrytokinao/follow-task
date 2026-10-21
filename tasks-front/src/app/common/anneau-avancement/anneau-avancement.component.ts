import {Component, Input} from '@angular/core';

/** Rayon du cercle dans un repère de 24 : le trait de 3 tient dans le cadre. */
const RAYON = 9.5;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

/**
 * Avancement d'une tâche en anneau SVG, le pourcentage au centre : tient dans
 * une ligne de liste, à côté du statut et des assignés. Vert à 100 %.
 */
@Component({
  standalone: true,
  selector: 'app-anneau-avancement',
  templateUrl: './anneau-avancement.component.html',
  styleUrls: ['./anneau-avancement.component.css']
})
export class AnneauAvancementComponent {

  readonly rayon = RAYON;
  readonly circonference = CIRCONFERENCE;

  pourcentage = 0;
  /** Longueur du trait non dessinée : le reste de l'anneau. */
  reste = CIRCONFERENCE;

  /** Côté de l'anneau, en pixels. */
  @Input() taille = 24;

  @Input()
  set valeur(valeur: number | null | undefined) {
    this.pourcentage = Math.min(100, Math.max(0, Math.round(valeur ?? 0)));
    this.reste = CIRCONFERENCE * (1 - this.pourcentage / 100);
  }
}
