import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DirectionComponent} from './direction.component';

const directionRoutes: Routes = [
  {path: '', component: DirectionComponent}
];

@NgModule({
  imports: [RouterModule.forChild(directionRoutes)],
  exports: [RouterModule]
})
export class DirectionRoutingModule {
}
