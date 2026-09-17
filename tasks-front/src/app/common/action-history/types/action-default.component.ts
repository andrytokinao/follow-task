import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionItemBase } from '../action-item-base';
import { ActionItemFrameComponent } from '../action-item-frame/action-item-frame.component';
import { ActionType } from '../../../type/issue';

/**
 * Repli pour une nature d'action qui n'a pas encore son composant : la ligne
 * reste visible, avec l'auteur et l'heure, au lieu de disparaître en silence.
 */
@Component({
  selector: 'app-action-default',
  standalone: true,
  imports: [CommonModule, ActionItemFrameComponent],
  template: `
    <app-action-item-frame [vue]="this">{{ libelle }}</app-action-item-frame>
  `
})
export class ActionDefaultComponent extends ActionItemBase {
  readonly icone = 'fa-circle-dot';

  private static readonly LIBELLES: Partial<Record<ActionType, string>> = {
    CHANGE_FIELD: 'a modifié un champ',
    CUSTOM_FIELD: 'a modifié un champ personnalisé',
    ADD_EVENT: 'a planifié la tâche',
    CHANGE_PROFILE: 'a modifié un profil',
    UPLOAD: 'a déposé un fichier',
  };

  get libelle(): string {
    return ActionDefaultComponent.LIBELLES[this.action.actionType] ?? 'a modifié la tâche';
  }
}
