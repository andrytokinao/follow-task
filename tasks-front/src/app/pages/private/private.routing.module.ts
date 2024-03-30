import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {PrivateComponent} from "./private.component";
import {ProjectComponent} from "./project/project.component";
import {AdminComponent} from "./admin/admin.component";
import {ProfileComponent} from "./profile/profile.component";
import {AccessDeniedComponent} from "./access-denied/access-denied.component";
import {AdminnGuard} from "../../services/authorization.service.ts";

const privateRoute: Routes = [
  {
    path: '',
    component: PrivateComponent,
    children: [
      {
        path: '',
        children: [
          { path: 'profile', component: ProfileComponent  },
          { path: 'access-denied', component: AccessDeniedComponent },
          { path: 'project', component: ProjectComponent } ,{
            path: 'project',
            loadChildren: () => import('./project/project.module').then(m => m.ProjectModule),
            //  canMatch: [userProject]
          },
          {path: 'admin', component: AdminComponent  , canActivate :[AdminnGuard]}, {
            path: 'admin',
            loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
            //  canMatch: [userAdmin]
          }
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
