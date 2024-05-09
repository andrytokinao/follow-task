import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {HelpComponent} from "./help/help.component";
import {LoginComponent} from "./login/login.component";
import {PublicComponent} from "./public.component";

const publicRoute: Routes = [
  {
    path: '',
    component: PublicComponent,
    children: [
      {
        path: '',
        children: [
          { path: '',   redirectTo: 'home', pathMatch: 'full' },
          { path: 'home', component: HomeComponent },
          { path: 'help', component: HelpComponent },
          { path: 'login', component: LoginComponent},
        ]
      }
    ]
  }
];


@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(publicRoute)
  ],
  exports: [
    RouterModule
  ],
  providers: [],
  bootstrap: []
})
export class PublicRoutingModule {
}
