import {Component, EventEmitter, Input, Output} from '@angular/core';
import {PorteeOutil} from '../../../../../type/outil';

/**
 * Choix du partage à la création d'un dossier ou d'un outil (DT-019) :
 * rester dans l'espace ouvert, ou partager avec tous les espaces.
 * `verrouille` : seul « l'espace » est possible (dossier parent réservé à l'espace).
 */
@Component({
  standalone: false,
  selector: 'app-choix-portee',
  templateUrl: './choix-portee.component.html',
  styleUrl: './choix-portee.component.css'
})
export class ChoixPorteeComponent {

  @Input() portee: PorteeOutil = 'ESPACE';
  @Output() porteeChange = new EventEmitter<PorteeOutil>();
  @Input() espaceNom = '';
  @Input() verrouille = false;
  @Input() desactive = false;

  choisir(portee: PorteeOutil): void {
    if (this.desactive || (this.verrouille && portee === 'TOUS_LES_ESPACES') || portee === this.portee) {
      return;
    }
    this.portee = portee;
    this.porteeChange.emit(portee);
  }
}
