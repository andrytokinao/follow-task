import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {PrivateComponent} from "./private.component";
import {ProjectComponent} from "./project/project.component";
import {AdminComponent} from "./admin/admin.component";
import {ProfileComponent} from "./profile/profile.component";

const privateRoute: Routes = [
  {
    path: '',
    component: PrivateComponent,
    children: [
      {
        path: '',
        children: [
          { path: 'profile', component: ProfileComponent  ,data: { num: 4 }},
          { path: 'project', component: ProjectComponent ,data: { num: 4 }}, {
            path: 'project',
            loadChildren: () => import('./project/project.module').then(m => m.ProjectModule),
            //  canMatch: [userProject]
          },
          {path: 'admin', component: AdminComponent  ,data: { num: 4 }}, {
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
