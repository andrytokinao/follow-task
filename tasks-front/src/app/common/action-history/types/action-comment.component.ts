import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionItemBase, ActionTonalite } from '../action-item-base';
import { ActionItemFrameComponent } from '../action-item-frame/action-item-frame.component';

/**
 * « Andry a commenté » suivi d'un extrait.
 *
 * Couvre les deux chemins de commentaire : l'entité Comment (action COMMENT)
 * et le Document de type COMMENT_FILES de la fiche de tâche (action DOCUMENT).
 */
@Component({
  selector: 'app-action-comment',
  standalone: true,
  imports: [CommonModule, ActionItemFrameComponent],
  template: `
    <app-action-item-frame [vue]="this">
      a commenté
      <div detail class="ai-extrait" *ngIf="texte">{{ texte }}</div>
    </app-action-item-frame>
  `,
  styleUrl: './action-item-body.scss'
})
export class ActionCommentComponent extends ActionItemBase {
  readonly icone = 'fa-comment';
  override readonly tonalite: ActionTonalite = 'comment';

  get texte(): string {
    return this.extrait(this.action.comment?.text?.toString() ?? this.action.document?.description);
  }
}
