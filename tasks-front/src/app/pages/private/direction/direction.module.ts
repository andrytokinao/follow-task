import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DirectionRoutingModule} from './direction.routing.module';
import {DirectionComponent} from './direction.component';
import {DirectionOverviewComponent} from './overview/direction-overview.component';
import {DirectionPlaceholderComponent} from './placeholder/direction-placeholder.component';
import {UserMenuComponent} from '../../../common/user-menu/user-menu.component';
import {AvatarComponent} from '../../../common/avatar/avatar.component';
import {DirectionProjetDetailComponent} from './projet-detail/direction-projet-detail.component';

/**
 * Cockpit de direction : vue transversale, en lecture seule, de tous les
 * projets et de toutes les équipes. Chargé à la demande sur /direction.
 */
@NgModule({
  declarations: [
    DirectionComponent,
    DirectionOverviewComponent,
    DirectionPlaceholderComponent,
    DirectionProjetDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DirectionRoutingModule,
    UserMenuComponent,
    AvatarComponent
  ]
})
export class DirectionModule {
}
