import { Component, Input, OnChanges, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActionHistorique } from '../../../type/issue';
import { ActionItemBase } from '../action-item-base';
import { composantPourAction } from '../action-item.registry';

/**
 * Point d'entrée unique pour afficher une action : il choisit, dans le
 * registre, le composant qui correspond à sa nature. Les écrans n'ont ainsi
 * jamais à connaître la liste des types d'action.
 */
@Component({
  selector: 'app-action-item',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `<ng-container *ngComponentOutlet="composant; inputs: { action: action }"></ng-container>`
})
export class ActionItemComponent implements OnChanges {
  @Input({ required: true }) action!: ActionHistorique;

  composant: Type<ActionItemBase> | null = null;

  ngOnChanges(): void {
    this.composant = this.action ? composantPourAction(this.action) : null;
  }
}
