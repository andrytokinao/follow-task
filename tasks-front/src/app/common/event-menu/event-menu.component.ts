import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';
import {EditEventComponent} from '../edit-event/edit-event.component';
import {EventApp} from '../../type/issue';

/** Point d'affichage, en coordonnées de la fenêtre. */
export interface PositionMenu {
  x: number;
  y: number;
}

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
 * contextuels et à onEventClick, mais pas à onTimeRangeSelected. On mémorise
 * donc le dernier relâchement de pointeur, en phase de capture pour le lire
 * avant que DayPilot ne traite la sélection.
 */
@Component({
  standalone: false,
  selector: 'app-event-menu',
  templateUrl: './event-menu.component.html',
  styleUrl: './event-menu.component.css'
})
export class EventMenuComponent implements OnDestroy {

  /** Émis après enregistrement : l'hôte recharge son planning. */
  @Output() saved = new EventEmitter<EventApp>();

  @ViewChild(MatMenuTrigger) private trigger!: MatMenuTrigger;
  @ViewChild(EditEventComponent) private formulaire!: EditEventComponent;

  x = 0;
  y = 0;

  private dernierPointeur?: PositionMenu;

  private readonly memoriserPointeur = (event: PointerEvent) => {
    this.dernierPointeur = {x: event.clientX, y: event.clientY};
  };

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {
    // Hors zone : chaque relâchement de souris déclencherait sinon une
    // détection de changements dans toute l'application.
    this.zone.runOutsideAngular(() =>
      document.addEventListener('pointerup', this.memoriserPointeur, true));
  }

  ngOnDestroy(): void {
    document.removeEventListener('pointerup', this.memoriserPointeur, true);
  }

  /**
   * @param position l'évènement souris quand l'hôte l'a (menu contextuel,
   *                 clic sur un événement, bouton) ; à défaut, le dernier clic.
   */
  ouvrirCreation(preRempli: Partial<EventApp>, position?: PositionMenu | MouseEvent): void {
    this.ouvrir(position, () => this.formulaire.prepareCreation(preRempli));
  }

  ouvrirEdition(eventId: number | string, position?: PositionMenu | MouseEvent): void {
    if (eventId == null) {
      return;
    }
    this.ouvrir(position, () => this.formulaire.loadEvent(eventId));
  }

  fermer(): void {
    this.trigger?.closeMenu();
  }

  onSaved(event: EventApp): void {
    this.fermer();
    this.saved.emit(event);
  }

  private ouvrir(position: PositionMenu | MouseEvent | undefined, preparer: () => void): void {
    const cible = this.resoudre(position);
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
      // Le déclencheur doit être à sa nouvelle place avant que l'overlay
      // calcule la position du panneau.
      this.cdr.detectChanges();
      preparer();
      this.trigger.openMenu();
    });
  }

  private resoudre(position: PositionMenu | MouseEvent | undefined): PositionMenu {
    if (position instanceof MouseEvent) {
      return {x: position.clientX, y: position.clientY};
    }
    if (position) {
      return position;
    }
    if (this.dernierPointeur) {
      return this.dernierPointeur;
    }
    // Ouverture sans clic connu (clavier, appel programmatique) : au centre.
    return {x: window.innerWidth / 2, y: window.innerHeight / 3};
  }
}
