import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DirectionComponent} from './direction.component';
import {DirectionGanttProjetsComponent} from './gantt-projets/direction-gantt-projets.component';
import {SituationComponent} from './situation/situation.component';

const directionRoutes: Routes = [
  {path: '', component: DirectionComponent},
  // Tous les projets en diagramme de Gantt, sans menu : une page à part.
  {path: 'gantt', component: DirectionGanttProjetsComponent},
  // Situation du jour (DT-005) : fiabilité, projets, qui fait quoi maintenant.
  {path: 'situation', component: SituationComponent}
];

@NgModule({
  imports: [RouterModule.forChild(directionRoutes)],
  exports: [RouterModule]
})
export class DirectionRoutingModule {
}
