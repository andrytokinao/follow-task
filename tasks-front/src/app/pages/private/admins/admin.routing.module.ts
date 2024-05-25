import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {UsersComponent} from "./users/users.component";
import {GroupsComponent} from "./groups/groups.component";
import {AdminComponent} from "./admin.component";
import {CreateProjectComponent} from "./config-project/create-project.component";
import {ConfigurationModule} from "./configuration/configuration.module";
import {ConfigurationComponent} from "./configuration/configuration.component";

const adminRoute: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        children: [
          { path: '',   redirectTo: 'users', pathMatch: 'full' },
          { path: 'users', component: UsersComponent},
          { path: 'groups', component: GroupsComponent },
          { path: 'project',   component: CreateProjectComponent },
          { path: 'project',
            loadChildren:()=> import("./config-project/create-project.module").then(m => m.CreateProjectModule),
          },
          { path: 'config',   component: ConfigurationComponent },
          { path: 'config',
            loadChildren:()=> import("./configuration/configuration.module").then(m => m.ConfigurationModule),
          },
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
