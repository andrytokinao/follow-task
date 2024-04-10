import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {InstallationComponent} from "./installation.component";
import {InstallDataComponent} from "./install-data/install-data.component";
import {WorkSpaceComponent} from "./work-space/work-space.component";
import {CreateAdminUserComponent} from "./create-admin-user/create-admin-user.component";
import {MediaSpaceComponent} from "./media-space/media-space.component";
import {AdminnGuard, AuthGuard, InstallationGuard} from "../../services/authorization.service.ts";
import {CreateProjectComponent} from "./create-project/create-project.component";

const installRoute: Routes = [
  {
    path: '',
    component: InstallationComponent,
    children: [
      {
        path: '',
        children: [
          { path: '', redirectTo: "create-user-admin", pathMatch : "prefix"  },
          { path: 'data', component: InstallDataComponent  },
          { path: 'work-space', component: WorkSpaceComponent, canActivate:[InstallationGuard] },
          { path: 'media-space', component: MediaSpaceComponent, canActivate:[InstallationGuard] },
          { path: 'create-user-admin', component: CreateAdminUserComponent},
          { path: 'first-project',
            loadChildren:()=> import("./create-project/create-project.module").then(m=>m.CreateProjectModule)
          , canActivate:[InstallationGuard]},

        ]
      }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(installRoute)],
  exports: [
    RouterModule]
})
export class InstallationRoutingModule { }
