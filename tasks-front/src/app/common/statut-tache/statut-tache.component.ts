import {Component, Input} from '@angular/core';
import {Status} from '../../type/issue';
import {couleurDuStatut} from '../type-tache/type-tache.util';

/**
 * Statut d'une tâche en lecture seule : pastille dans la couleur du statut.
 * Pour le changer, app-status-field.
 */
@Component({
  standalone: true,
  selector: 'app-statut-tache',
  templateUrl: './statut-tache.component.html',
  styleUrl: './statut-tache.component.css'
})
export class StatutTacheComponent {
  couleur = couleurDuStatut(undefined);
  libelle = '';

  @Input()
  set status(status: Status | null | undefined) {
    this.couleur = couleurDuStatut(status);
    this.libelle = String(status?.displayName ?? '');
  }
}
