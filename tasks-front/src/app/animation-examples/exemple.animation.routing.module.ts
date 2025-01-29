import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from "./home/home.component";

import {AboutComponent} from "./about/about.component";
import {AnimationExamplesComponent} from "./animation-examples.component";
import {ContactComponent} from "./contact/contact.component";
import {FollowComponent} from "./follow/follow.component";
import {LoginComponent} from "../pages/public/login/login.component";
import {MatDialogModule} from "@angular/material/dialog";
import {MatTabsModule} from "@angular/material/tabs";

const animationRoute: Routes = [
  {
    path: '',
    component: AnimationExamplesComponent,
    children: [
      {
        path: '',
        children: [
          { path: '',   redirectTo: 'home', pathMatch: 'full' },
          { path: '', redirectTo: 'home', pathMatch: 'full' },
          { path: 'home', component: HomeComponent, data: {state: 'home'} },
          { path: 'about', component: AboutComponent, data: {state: 'about'}},
          { path: 'contact', component: ContactComponent, data: {state: 'contact'} },
          { path: 'follow', component: FollowComponent, data: {state: 'follow'} },
          { path: 'login', component: LoginComponent, data: {state: 'follow'} },
        ]
      }
    ]
  }
];


@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(animationRoute)
  ],
  exports: [
    RouterModule
  ],
  providers: [],
  bootstrap: []})
export class ExempleAnimationRoutingModule {
}
