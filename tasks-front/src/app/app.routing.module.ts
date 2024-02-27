import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {ProjectComponent} from "./pages/project/project.component";
import {DashboardComponent} from "./pages/dashboard/dashboard.component";
import {HomeComponent} from "./pages/home/home.component";
import {LoginComponent} from "./pages/login/login.component";


const appRoutes: Routes = [
  { path: '',   redirectTo: 'index.html', pathMatch: 'full' ,data: { num: 0 }},
  { path: 'home',   redirectTo: 'index.html', pathMatch: 'full' ,data: { num: 0 } },
  { path: 'index',   redirectTo: 'index.html', pathMatch: 'full'  ,data: { num: 0 }},
  {path: 'project', component: ProjectComponent, outlet: 'project'  ,data: { num: 1 }}, {
    path: 'project',
    loadChildren: () => import('./pages/project/project.module').then(m => m.ProjectModule),
  //  canMatch: [userProject]
  },
  {path: 'dashboard', component: DashboardComponent, outlet: 'dashboard'  ,data: { num: 2 }}, {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule),
    //  canMatch: [userDashoard]
  },
  {path: 'login', component: LoginComponent, outlet: 'login'  ,data: { num: 3 }}, {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule),
    //  canMatch: [public]
  },
  {path: 'admin', component: DashboardComponent, outlet: 'admin'  ,data: { num: 4 }}, {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminModule),
    //  canMatch: [userAdmin]
  },

  {path: 'index.html', component: HomeComponent ,data: { num: 0 }},
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [
    RouterModule ,BrowserModule  ]
})
export class AppRoutingModule { }
