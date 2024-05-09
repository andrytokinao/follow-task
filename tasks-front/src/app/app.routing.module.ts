import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {PublicComponent} from "./pages/public/public.component";
import {PrivateComponent} from "./pages/private/private.component";
import {NotFoundComponent} from "./pages/not-found/not-found.component";
import {AuthGuard} from "./services/authorization.service.ts";


const appRoutes: Routes = [
  { path: '',   redirectTo: 'public/home', pathMatch: 'full'  },
  { path: 'login',   redirectTo: 'public/login', pathMatch: 'full'  },
  {path: 'public', component: PublicComponent}, {
    path: 'public',
    loadChildren: () => import('./pages/public/public.module').then(m => m.PublicModule),
    //  canMatch: [userAdmin]
  },
  {path: 'private', component: PrivateComponent }, {
    path: 'private',
    loadChildren: () => import('./pages/private/private.module').then(m => m.PrivateModule),
    //  canMatch: [userAdmin]
  },
  { path: '**',   component: NotFoundComponent ,data: { num: 0 } },

];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [
    RouterModule ,BrowserModule  ]
})
export class AppRoutingModule { }
