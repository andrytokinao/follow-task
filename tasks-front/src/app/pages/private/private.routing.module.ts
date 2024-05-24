import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {PrivateComponent} from "./private.component";
import {ProjectComponent} from "./project/project.component";
import {AdminComponent} from "./admins/admin.component";
import {ProfileComponent} from "./profile/profile.component";
import {AccessDeniedComponent} from "./access-denied/access-denied.component";
import {AuthGuard} from "../../services/authorization.service.ts";

const privateRoute: Routes = [
  {
    path: '',
    component: PrivateComponent,
    children: [
      {
        path: '',
        children: [
          { path: '',   redirectTo: 'project', pathMatch: 'full' },
          { path: 'profile', component: ProfileComponent  },
          { path: 'access-denied', component: AccessDeniedComponent },
          { path: 'project/:project', component: ProjectComponent } ,
          {
            path: 'project/:project',
            loadChildren: () => import('./project/project.module').then(m => m.ProjectModule),
            //  canMatch: [userProject]
          },
          {path: 'admin', component: AdminComponent  , canActivate :[AuthGuard]}, {
            path: 'admin',
            loadChildren: () => import('./admins/admin.module').then(m => m.AdminModule),
            //  canMatch: [userAdmin]
          },

        ]
      }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(privateRoute)],
  exports: [
    RouterModule]
})
export class PrivateRoutingModule { }
