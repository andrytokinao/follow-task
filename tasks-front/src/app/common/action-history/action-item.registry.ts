import { Type } from '@angular/core';
import { ActionHistorique } from '../../type/issue';
import { ActionItemBase } from './action-item-base';
import { ActionAssigneComponent } from './types/action-assigne.component';
import { ActionStatusComponent } from './types/action-status.component';
import { ActionCommentComponent } from './types/action-comment.component';
import { ActionDocumentComponent } from './types/action-document.component';
import { ActionDefaultComponent } from './types/action-default.component';

export interface ActionItemRendu {
  /** Ce composant sait-il afficher cette action ? */
  accepte: (action: ActionHistorique) => boolean;
  composant: Type<ActionItemBase>;
}

/**
 * Qui affiche quoi. La première entrée qui accepte l'action l'emporte :
 * l'ordre compte — le commentaire déposé comme Document doit être reconnu
 * avant le document ordinaire.
 */
export const ACTION_ITEM_RENDUS: ActionItemRendu[] = [
  { accepte: a => a.actionType === 'ASSIGN', composant: ActionAssigneComponent },
  { accepte: a => a.actionType === 'STATUS', composant: ActionStatusComponent },
  {
    accepte: a => a.actionType === 'COMMENT'
      || (a.actionType === 'DOCUMENT' && a.document?.typeDocument === 'COMMENT_FILES'),
    composant: ActionCommentComponent
  },
  { accepte: a => a.actionType === 'DOCUMENT', composant: ActionDocumentComponent },
];

export function composantPourAction(action: ActionHistorique): Type<ActionItemBase> {
  return ACTION_ITEM_RENDUS.find(rendu => rendu.accepte(action))?.composant ?? ActionDefaultComponent;
}
