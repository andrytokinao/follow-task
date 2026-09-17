import {Directive, HostListener} from '@angular/core';
import {MAT_MENU_PANEL} from '@angular/material/menu';

/**
 * Marque un contenu interactif (un formulaire) placé dans un mat-menu.
 *
 * Un mat-menu est conçu pour des éléments qu'on choisit, puis il se ferme. Un
 * formulaire embarqué casse cette hypothèse de deux façons, que cette
 * directive neutralise au même endroit plutôt qu'à coups de stopPropagation
 * dispersés :
 *
 * 1. Fermeture en cascade. Un matMenuTriggerFor posé dans le contenu récupère
 *    le mat-menu englobant comme parent (injection de MAT_MENU_PANEL). Quand
 *    son propre menu se ferme sur un clic d'élément, Material propage la
 *    fermeture au parent : choisir une tâche dans le sélecteur fermait tout
 *    le formulaire. Aucun stopPropagation DOM ne l'empêche — la propagation
 *    passe par un EventEmitter. On coupe donc le lien : sous cette directive,
 *    MAT_MENU_PANEL vaut null, et les sélecteurs deviennent des menus
 *    autonomes.
 *
 * 2. Fermeture au clic et vol du clavier. Le panneau se ferme sur tout clic
 *    qui l'atteint, et son gestionnaire clavier consomme flèches et Début/Fin
 *    (preventDefault), bloquant le curseur dans les champs. On arrête clics et
 *    touches au bord du contenu — sauf Échap, qui doit toujours fermer.
 *
 * À poser sur tout futur contenu de ce type, par exemple un formulaire de
 * création de projet ou de tâche ouvert depuis un sélecteur.
 */
@Directive({
  // Autonome : utilisable aussi bien dans les modules que dans les composants
  // autonomes comme issue-picker-menu.
  standalone: true,
  selector: '[appContenuMenu]',
  providers: [{provide: MAT_MENU_PANEL, useValue: null}]
})
export class ContenuMenuDirective {

  @HostListener('click', ['$event'])
  arreterClic(event: Event): void {
    event.stopPropagation();
  }

  @HostListener('keydown', ['$event'])
  arreterClavier(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      event.stopPropagation();
    }
  }
}
