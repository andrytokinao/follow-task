import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DirectionComponent} from './direction.component';
import {DirectionGanttProjetsComponent} from './gantt-projets/direction-gantt-projets.component';

const directionRoutes: Routes = [
  {path: '', component: DirectionComponent},
  // Tous les projets en diagramme de Gantt, sans menu : une page à part.
  {path: 'gantt', component: DirectionGanttProjetsComponent}
];

@NgModule({
  imports: [RouterModule.forChild(directionRoutes)],
  exports: [RouterModule]
})
export class DirectionRoutingModule {
}
