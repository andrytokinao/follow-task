import { FollowComponent } from './follow/follow.component';
import { ContactComponent } from './contact/contact.component';
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { Routes, RouterModule } from '@angular/router';
import {LoginComponent} from "../pages/public/login/login.component";
import {PublicComponent} from "../pages/public/public.component";
import {HelpComponent} from "../pages/public/help/help.component";

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, data: {state: 'home'} },
  { path: 'about', component: AboutComponent, data: {state: 'about'}},
  { path: 'contact', component: ContactComponent, data: {state: 'contact'} },
  { path: 'follow', component: FollowComponent, data: {state: 'follow'} },
  { path: 'login', component: LoginComponent, data: {state: 'follow'} },
];
const publicRoute: Routes = [
  {
    path: '',
    component: PublicComponent,
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

export const AnimationExamplesRoutes = RouterModule.forChild(routes);

