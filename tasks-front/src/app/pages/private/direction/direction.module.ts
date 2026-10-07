import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DirectionRoutingModule} from './direction.routing.module';
import {DirectionComponent} from './direction.component';
import {DirectionProjetDetailComponent} from './projet-detail/direction-projet-detail.component';
import {DirectionFicheProjetComponent} from './fiche-projet/direction-fiche-projet.component';
import {DirectionCommentairesComponent} from './commentaires/direction-commentaires.component';
import {UserMenuComponent} from '../../../common/user-menu/user-menu.component';
import {AvatarComponent} from '../../../common/avatar/avatar.component';
import {CustomFieldComponent} from '../../../common/custom-field/custom-field.component';

/**
 * Cockpit de direction : projets en cours de la société et leurs tâches, par
 * département. Lecture seule, sauf les commentaires. Chargé à la demande sur
 * /direction.
 */
@NgModule({
  declarations: [
    DirectionComponent,
    DirectionFicheProjetComponent,
    DirectionProjetDetailComponent,
    DirectionCommentairesComponent
  ],
  imports: [
    CommonModule,
    DirectionRoutingModule,
    UserMenuComponent,
    AvatarComponent,
    CustomFieldComponent
  ]
})
export class DirectionModule {
}
