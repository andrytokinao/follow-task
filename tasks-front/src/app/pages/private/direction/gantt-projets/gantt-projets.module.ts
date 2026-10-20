import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatMenuModule} from '@angular/material/menu';
import {MyCommonModule} from '../../../../common/common.module';
import {AvatarComponent} from '../../../../common/avatar/avatar.component';
import {TypeTacheComponent} from '../../../../common/type-tache/type-tache.component';
import {DirectionGanttProjetsComponent} from './direction-gantt-projets.component';

/**
 * Gantt des projets d'un espace de travail (`app-direction-gantt-projets`),
 * partagé par le cockpit de direction et l'espace de travail. Chaque hôte
 * fournit l'espace à suivre (`[espace$]`).
 */
@NgModule({
  declarations: [DirectionGanttProjetsComponent],
  imports: [
    CommonModule,
    // Sélecteur « Grouper par ».
    FormsModule,
    // app-assignee-filter et app-event-menu.
    MyCommonModule,
    MatMenuModule,
    AvatarComponent,
    TypeTacheComponent
  ],
  exports: [DirectionGanttProjetsComponent]
})
export class GanttProjetsModule {
}
