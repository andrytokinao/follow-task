import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionItemBase, ActionTonalite } from '../action-item-base';
import { ActionItemFrameComponent } from '../action-item-frame/action-item-frame.component';

/** « Andry a assigné la tâche à Rakoto (auparavant Soa) ». */
@Component({
  selector: 'app-action-assigne',
  standalone: true,
  imports: [CommonModule, ActionItemFrameComponent],
  template: `
    <app-action-item-frame [vue]="this">
      <ng-container *ngIf="action.assigne; else retrait">
        a assigné la tâche à <span class="ai-cible">{{ nomDe(action.assigne) }}</span>
        <ng-container *ngIf="action.oldAssigne && action.oldAssigne.id !== action.assigne.id">
          (auparavant <span class="ai-barre">{{ nomDe(action.oldAssigne) }}</span>)
        </ng-container>
      </ng-container>
      <ng-template #retrait>
        a retiré l'assignation<ng-container *ngIf="action.oldAssigne">
          de <span class="ai-cible">{{ nomDe(action.oldAssigne) }}</span></ng-container>
      </ng-template>
    </app-action-item-frame>
  `,
  styleUrl: './action-item-body.scss'
})
export class ActionAssigneComponent extends ActionItemBase {
  readonly icone = 'fa-user-check';
  override readonly tonalite: ActionTonalite = 'assign';
}
