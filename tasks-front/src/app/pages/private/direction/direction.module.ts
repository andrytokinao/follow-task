import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DirectionRoutingModule} from './direction.routing.module';
import {DirectionComponent} from './direction.component';
import {DirectionProjetDetailComponent} from './projet-detail/direction-projet-detail.component';
import {UserMenuComponent} from '../../../common/user-menu/user-menu.component';
import {AvatarComponent} from '../../../common/avatar/avatar.component';

/**
 * Cockpit de direction : projets en cours de la société et leurs tâches, par
 * département. Lecture seule. Chargé à la demande sur /direction.
 */
@NgModule({
  declarations: [DirectionComponent, DirectionProjetDetailComponent],
  imports: [
    CommonModule,
    DirectionRoutingModule,
    UserMenuComponent,
    AvatarComponent
  ]
})
export class DirectionModule {
}
