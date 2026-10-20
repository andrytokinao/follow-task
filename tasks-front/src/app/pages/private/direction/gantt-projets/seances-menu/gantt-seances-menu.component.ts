import {ChangeDetectorRef, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';
import {UserService} from '../../../../../services/user.service';
import {PositionMenu} from '../../../../../services/dernier-pointeur.service';
import {User} from '../../../../../type/issue';
import {Serie} from '../gantt-projets.model';
import {DetailSeance, detailsSeances} from './gantt-seances';

/** Séance choisie dans le menu : l'hôte ouvre sa fiche, au même endroit. */
export interface SeanceChoisie {
  id: number | string;
  position: PositionMenu;
}

/**
 * Menu d'une barre du Gantt, ouvert à l'endroit du clic : le détail de
 * chacune de ses séances (qui, quoi, quand, durée, état, description). Un clic
 * sur une séance ouvre sa fiche.
 */
@Component({
  standalone: false,
  selector: 'app-gantt-seances-menu',
  templateUrl: './gantt-seances-menu.component.html',
  styleUrls: ['./gantt-seances-menu.component.css']
})
export class GanttSeancesMenuComponent {

  @Output() consulter = new EventEmitter<SeanceChoisie>();

  @ViewChild(MatMenuTrigger) private trigger!: MatMenuTrigger;

  x = 0;
  y = 0;
  titre = '';
  /** « Réalisé » ou « Planifié ». */
  nature = '';
  seances: DetailSeance[] = [];

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {
  }

  /** @param reel la barre est du réalisé (sinon, de la planification) */
  ouvrir(titre: string, serie: Serie, reel: boolean, event: MouseEvent): void {
    // Le clic courant n'est pas fini : ouvrir tout de suite le laisserait refermer le menu.
    setTimeout(() => {
      if (this.trigger.menuOpen) {
        this.trigger.closeMenu();
      }
      this.x = event.clientX;
      this.y = event.clientY;
      this.titre = titre;
      this.nature = reel ? 'Réalisé' : 'Planifié';
      this.seances = detailsSeances(serie, reel);
      this.cdr.detectChanges();
      this.trigger.openMenu();
    });
  }

  choisir(seance: DetailSeance): void {
    if (seance.id != null) {
      this.consulter.emit({id: seance.id, position: {x: this.x, y: this.y}});
    }
  }

  photoDe(personne: User | null): string | null {
    return personne?.photo ? this.userService.getUrlPhoto(personne) : null;
  }

  parSeance(_: number, seance: DetailSeance): unknown {
    return seance.id;
  }
}
