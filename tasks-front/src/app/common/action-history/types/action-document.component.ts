import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionItemBase, ActionTonalite } from '../action-item-base';
import { ActionItemFrameComponent } from '../action-item-frame/action-item-frame.component';

/** « Andry a ajouté le document « Cahier des charges » ». */
@Component({
  selector: 'app-action-document',
  standalone: true,
  imports: [CommonModule, ActionItemFrameComponent],
  template: `
    <app-action-item-frame [vue]="this">
      a ajouté le document
      <span class="ai-cible" *ngIf="action.document?.titre">« {{ action.document.titre }} »</span>
    </app-action-item-frame>
  `,
  styleUrl: './action-item-body.scss'
})
export class ActionDocumentComponent extends ActionItemBase {
  readonly icone = 'fa-paperclip';
  override readonly tonalite: ActionTonalite = 'document';
}
