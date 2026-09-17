import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
  ViewChild
} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';
import {EditEventComponent} from '../edit-event/edit-event.component';
import {EventDetailComponent} from '../event-detail/event-detail.component';
import {EventApp} from '../../type/issue';
import {DernierPointeurService, PositionMenu} from '../../services/dernier-pointeur.service';

export type {PositionMenu};

/**
 * Formulaire d'événement affiché en menu, à côté du clic — jamais en popup.
 *
 * Une popup centrée masque le planning au moment précis où l'on en a besoin :
 * on choisit un créneau pour le voir, pas pour qu'il disparaisse sous une
 * fenêtre. Le menu s'ouvre là où l'on a cliqué et laisse le reste visible.
 *
 * Ce composant porte tout ce que chaque planning refaisait à sa façon — ou ne
 * faisait pas : le déclencheur invisible, son placement, la largeur du panneau
 * et la réouverture à un autre endroit. Les hôtes n'ont plus qu'à appeler
 * ouvrirCreation ou ouvrirEdition.
 *
 * Position du clic : DayPilot fournit l'évènement souris à ses menus
 * contextuels et à onEventClick, mais pas à onTimeRangeSelected. On se rabat
 * alors sur le dernier relâchement de pointeur (DernierPointeurService).
 */
@Component({
  standalone: false,
  selector: 'app-event-menu',
  templateUrl: './event-menu.component.html',
  styleUrl: './event-menu.component.css'
})
export class EventMenuComponent {

  /** Émis après enregistrement : l'hôte recharge son planning. */
  @Output() saved = new EventEmitter<EventApp>();

  @ViewChild(MatMenuTrigger) private trigger!: MatMenuTrigger;
  @ViewChild(EditEventComponent) private formulaire!: EditEventComponent;
  @ViewChild(EventDetailComponent) private detail!: EventDetailComponent;

  x = 0;
  y = 0;
  mode: 'consultation' | 'edition' = 'edition';

  constructor(private pointeur: DernierPointeurService, private cdr: ChangeDetectorRef) {
  }

  /**
   * @param position l'évènement souris quand l'hôte l'a (menu contextuel,
   *                 clic sur un événement, bouton) ; à défaut, le dernier clic.
   */
  ouvrirCreation(preRempli: Partial<EventApp>, position?: PositionMenu | MouseEvent): void {
    this.ouvrir(position, 'edition', () => this.formulaire.prepareCreation(preRempli));
  }

  ouvrirEdition(eventId: number | string, position?: PositionMenu | MouseEvent): void {
    if (eventId == null) {
      return;
    }
    this.ouvrir(position, 'edition', () => this.formulaire.loadEvent(eventId));
  }

  /**
   * Consultation : ce que contient le créneau, avec les liens vers son projet
   * et sa tâche. « Modifier » rouvre le formulaire au même endroit.
   */
  ouvrirConsultation(eventId: number | string, position?: PositionMenu | MouseEvent): void {
    if (eventId == null) {
      return;
    }
    this.ouvrir(position, 'consultation', () => this.detail.loadEvent(eventId));
  }

  fermer(): void {
    this.trigger?.closeMenu();
  }

  onSaved(event: EventApp): void {
    this.fermer();
    this.saved.emit(event);
  }

  private ouvrir(position: PositionMenu | MouseEvent | undefined,
                 mode: 'consultation' | 'edition',
                 preparer: () => void): void {
    const cible = this.pointeur.resoudre(position);
    // Le traitement du clic courant n'est pas terminé : ouvrir tout de suite
    // laisserait ce même clic fermer le menu aussitôt.
    setTimeout(() => {
      if (this.trigger.menuOpen) {
        // Déjà ouvert ailleurs : openMenu serait sans effet et le panneau
        // resterait à l'ancien emplacement.
        this.trigger.closeMenu();
      }
      this.x = cible.x;
      this.y = cible.y;
      this.mode = mode;
      // Le déclencheur doit être à sa nouvelle place, et la bonne vue
      // affichée, avant que l'overlay calcule la position du panneau.
      this.cdr.detectChanges();
      preparer();
      this.trigger.openMenu();
    });
  }
}
