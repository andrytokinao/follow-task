import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../avatar/avatar.component';
import type { ActionItemBase } from '../action-item-base';

/**
 * Cadre commun à toutes les lignes d'historique : pastille, avatar, auteur et
 * heure. Le composant de chaque nature d'action y projette sa phrase, et un
 * éventuel détail (extrait de commentaire...) via l'attribut `detail`.
 */
@Component({
  selector: 'app-action-item-frame',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './action-item-frame.component.html',
  styleUrl: './action-item-frame.component.scss'
})
export class ActionItemFrameComponent {
  @Input({ required: true }) vue!: ActionItemBase;
}
