import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {NotFoundComponent} from "./pages/not-found/not-found.component";
import {AuthGuard} from "./services/SystemGuard";
import {PublicComponent} from "./pages/public/public.component";


export const appRoutes: Routes = [
 {
    path: '',
    loadChildren: () => import('./pages/public/public.module').then(m => m.PublicModule),
    //  canMatch: [userAdmin]
  },
  {
    path: 'working',
    loadChildren: () => import('./pages/private/private.module').then(m => m.PrivateModule),
    //  canMatch: [userAdmin]
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/private/admins/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
    data:{roles:['ADMIN']
    }
    },
  {
    path: 'exemple-animation',
    loadChildren: () => import('./animation-examples/animation-examples.module').then(m => m.AnimationExamplesModule),
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
