import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionItemBase, ActionTonalite } from '../action-item-base';
import { ActionItemFrameComponent } from '../action-item-frame/action-item-frame.component';
import { Status } from '../../../type/issue';

/** « Andry a changé le statut [Ouvert] → [En cours] ». */
@Component({
  selector: 'app-action-status',
  standalone: true,
  imports: [CommonModule, ActionItemFrameComponent],
  template: `
    <app-action-item-frame [vue]="this">
      a changé le statut
      <ng-container *ngIf="ancien">
        <ng-container *ngTemplateOutlet="puce; context: { libelle: ancien, statut: action.oldStatusValue }"></ng-container>
        <i class="fas fa-arrow-right ai-fleche"></i>
      </ng-container>
      <ng-container *ngTemplateOutlet="puce; context: { libelle: nouveau || '—', statut: action.status }"></ng-container>
    </app-action-item-frame>

    <ng-template #puce let-libelle="libelle" let-statut="statut">
      <span class="ai-statut">
        <span class="ai-statut__point" [style.background]="couleur(statut)"></span>{{ libelle }}
      </span>
    </ng-template>
  `,
  styleUrl: './action-item-body.scss'
})
export class ActionStatusComponent extends ActionItemBase {
  readonly icone = 'fa-arrows-rotate';
  override readonly tonalite: ActionTonalite = 'status';

  /** Le statut lié d'abord ; la colonne texte, figée à la création, en repli. */
  get ancien(): string {
    return (this.action.oldStatusValue?.displayName || this.action.oldStatus || '').toString();
  }

  get nouveau(): string {
    return (this.action.status?.displayName || this.action.newStatus || '').toString();
  }

  couleur(statut: Status | undefined): string | null {
    return statut?.color ? statut.color.toString() : null;
  }
}
