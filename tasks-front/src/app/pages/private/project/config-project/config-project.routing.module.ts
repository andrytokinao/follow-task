import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {ConfigProjectComponent} from "./config-project.component";
import {DialogOverviewComponent} from "./dialog-overview/dialog-overview.component";
import {AuthGuard} from "../../../../services/SystemGuard";
import {ConfigCustomFieldComponent} from "./config-custom-field/config-custom-field.component";
import {IssueTypeComponent} from "./issue-type/issue-type.component";
import {WorkFlowComponent} from "./work-flow/work-flow.component";
import {StorageComponent} from "./storage/storage.component";
import {AccessibilityComponent} from "./accessibility/accessibility.component";


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
          { path: 'work-flow', component: WorkFlowComponent , canActivate:[AuthGuard] , data: { roles: ['CAN_CREATE_PROJECT','CAN_ACCESS_ALL']}},
          { path: 'storage', component: StorageComponent , canActivate:[AuthGuard] , data: { roles: ['CAN_CREATE_PROJECT','CAN_ACCESS_ALL']}},
          { path: 'accessibility', component: AccessibilityComponent , canActivate:[AuthGuard] , data: { roles: ['ADMIN_PROJECT']}},
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
