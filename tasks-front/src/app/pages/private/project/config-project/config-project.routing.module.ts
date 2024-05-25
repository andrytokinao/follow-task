import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {ConfigProjectComponent} from "./config-project.component";
import {DialogOverviewComponent} from "./dialog-overview/dialog-overview.component";
import {AuthGuard} from "../../../../services/authorization.service.ts";


const createProject: Routes = [
  {
    path: '',
    component: ConfigProjectComponent,
    children: [
      {
        path: '',
        children: [
          { path: '', redirectTo: "create", pathMatch : "prefix"  },
          { path: 'create', component: DialogOverviewComponent ,canActivate:[AuthGuard], data: { roles: ['CAN_CREATE_PROJECT','CAN_ACCESS_ALL']} },
          { path: 'issue-type', component: DialogOverviewComponent ,canActivate:[AuthGuard] , data: { roles: ['CAN_CREATE_PROJECT','CAN_ACCESS_ALL']}},
          { path: 'work-flow', component: DialogOverviewComponent ,canActivate:[AuthGuard] , data: { roles: ['CAN_CREATE_PROJECT','CAN_ACCESS_ALL']}},
          { path: 'work-flow-status', component: DialogOverviewComponent , canActivate:[AuthGuard] , data: { roles: ['CAN_CREATE_PROJECT','CAN_ACCESS_ALL']}},
        ]
      }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(createProject)],
  exports: [
    RouterModule]
})
export class ConfigProjectRoutingModule { }
