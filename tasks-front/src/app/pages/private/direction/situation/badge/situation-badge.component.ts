import {Component, Input} from '@angular/core';
import {Apparence} from '../situation.model';

/**
 * Pastille d'un état ou d'un niveau : icône + mot + couleur, jamais la couleur
 * seule (lisible en impression et par un daltonien).
 */
@Component({
  standalone: false,
  selector: 'app-situation-badge',
  templateUrl: './situation-badge.component.html',
  styleUrl: './situation-badge.component.css'
})
export class SituationBadgeComponent {
  @Input({required: true}) apparence!: Apparence;
}
