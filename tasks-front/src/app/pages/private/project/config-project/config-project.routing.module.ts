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
import {ProjectGuard} from "../../../../services/ProjectGuard";
import {IssueType2Component} from "./issue-type2/issue-type2.component";


const createProject: Routes = [
  {
    path: '',
    component: ConfigProjectComponent,
    children: [
      {
        path: '',
        children: [
          { path: '', redirectTo: "create", pathMatch : "prefix"  },
          { path: 'create', component: DialogOverviewComponent ,canActivate:[ProjectGuard], data: { roles: ['CAN_EDIT_ALL']} },
          { path: 'issue-type', component: IssueType2Component ,canActivate:[ProjectGuard] , data: { roles: ['CAN_CONFIG_ISSUE_TYPE']}},
          { path: 'custom-field', component: ConfigCustomFieldComponent ,canActivate:[ProjectGuard] , data: { roles: ['CAN_CONFIG_CUSTOM_FIELD']}},
          { path: 'work-flow', component: WorkFlowComponent , canActivate:[ProjectGuard] , data: { roles: ['CAN_CONFIG_WORKFLOW']}},
          { path: 'storage', component: StorageComponent , canActivate:[ProjectGuard] , data: { roles: ['CAN_CONFIG_STORAGE']}},
          { path: 'accessibility', component: AccessibilityComponent , canActivate:[ProjectGuard] , data: { roles: ['CAN_EDIT_ROLE_USER']}},
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
