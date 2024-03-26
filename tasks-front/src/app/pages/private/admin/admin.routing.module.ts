import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {UsersComponent} from "./users/users.component";
import {GroupsComponent} from "./groups/groups.component";
import {ParametersComponent} from "./parameters/parameters.component";
import {AdminComponent} from "./admin.component";
import {NotFoundComponent} from "../../not-found/not-found.component";

const adminRoute: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        children: [
          { path: 'users', component: UsersComponent ,data: { num: 4 }},
          { path: 'groups', component: GroupsComponent  ,data: { num: 4 }},
          { path: 'parameters', component: ParametersComponent  ,data: { num: 4 }},
          { path: '**',   component: NotFoundComponent ,data: { num: 0 } },

        ]
      }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(adminRoute)],
  exports: [
    RouterModule]
})
export class AdminRoutingModule { }
