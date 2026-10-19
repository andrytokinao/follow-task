import {Component, Input} from '@angular/core';
import {IssueType} from '../../type/issue';
import {couleurDuType, iconeDuType} from './type-tache.util';

/**
 * Icône du type d'une tâche, dans la couleur du type. Le nom du type est en
 * info-bulle. À utiliser partout où une tâche est affichée.
 */
@Component({
  standalone: true,
  selector: 'app-type-tache',
  templateUrl: './type-tache.component.html',
  styleUrl: './type-tache.component.css'
})
export class TypeTacheComponent {
  icone = iconeDuType(undefined);
  couleur = couleurDuType(undefined);
  nom = '';

  @Input()
  set type(type: IssueType | null | undefined) {
    this.icone = iconeDuType(type);
    this.couleur = couleurDuType(type);
    this.nom = String(type?.name ?? '');
  }
}
