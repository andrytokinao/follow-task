import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DirectionRoutingModule} from './direction.routing.module';
import {DirectionComponent} from './direction.component';
import {DirectionShellComponent} from './shell/direction-shell.component';
import {DirectionAccueilComponent} from './accueil/direction-accueil.component';
import {DirectionProjetDetailComponent} from './projet-detail/direction-projet-detail.component';
import {DirectionFicheProjetComponent} from './fiche-projet/direction-fiche-projet.component';
import {DirectionCommentairesComponent} from './commentaires/direction-commentaires.component';
import {DirectionGanttComponent} from './gantt/direction-gantt.component';
import {DirectionGanttProjetsComponent} from './gantt-projets/direction-gantt-projets.component';
import {SituationComponent} from './situation/situation.component';
import {SituationFiabiliteComponent} from './situation/fiabilite/situation-fiabilite.component';
import {SituationChiffresComponent} from './situation/chiffres/situation-chiffres.component';
import {SituationPersonnesComponent} from './situation/personnes/situation-personnes.component';
import {SituationBadgeComponent} from './situation/badge/situation-badge.component';
import {UserMenuComponent} from '../../../common/user-menu/user-menu.component';
import {AvatarComponent} from '../../../common/avatar/avatar.component';
import {CustomFieldComponent} from '../../../common/custom-field/custom-field.component';
import {MyCommonModule} from '../../../common/common.module';
import {MatMenuModule} from '@angular/material/menu';

/**
 * Cockpit de direction : projets en cours d'un espace de travail et leurs
 * tâches, sous un menu à gauche (`DirectionShellComponent`). Lecture seule,
 * sauf les commentaires. Chargé à la demande sur /direction/:espace.
 */
@NgModule({
  declarations: [
    DirectionShellComponent,
    DirectionAccueilComponent,
    DirectionComponent,
    DirectionFicheProjetComponent,
    DirectionProjetDetailComponent,
    DirectionCommentairesComponent,
    DirectionGanttComponent,
    DirectionGanttProjetsComponent,
    SituationComponent,
    SituationFiabiliteComponent,
    SituationChiffresComponent,
    SituationPersonnesComponent,
    SituationBadgeComponent
  ],
  imports: [
    CommonModule,
    // Sélecteur « Grouper par » du Gantt des projets.
    FormsModule,
    DirectionRoutingModule,
    UserMenuComponent,
    AvatarComponent,
    CustomFieldComponent,
    // Composants communs de l'application, dont app-assign-field (assignés).
    MyCommonModule,
    MatMenuModule
  ]
})
export class DirectionModule {
}
