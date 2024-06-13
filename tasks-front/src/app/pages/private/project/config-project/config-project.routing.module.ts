import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {ConfigProjectComponent} from "./config-project.component";
import {DialogOverviewComponent} from "./dialog-overview/dialog-overview.component";
import {AuthGuard} from "../../../../services/authorization.service.ts";
import {ConfigCustomFieldComponent} from "./config-custom-field/config-custom-field.component";
import {IssueTypeComponent} from "./issue-type/issue-type.component";


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
          { path: 'issue-type', component: IssueTypeComponent ,canActivate:[AuthGuard] , data: { roles: ['CAN_CREATE_PROJECT','CAN_ACCESS_ALL']}},
          { path: 'custom-field', component: ConfigCustomFieldComponent ,canActivate:[AuthGuard] , data: { roles: ['CAN_CREATE_PROJECT','CAN_ACCESS_ALL']}},
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
