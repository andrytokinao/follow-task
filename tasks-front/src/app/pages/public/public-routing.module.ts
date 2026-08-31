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
          { path: '', component: HomeComponent , data:{state:'home'} },
          { path: 'help', component: HelpComponent , data:{title:'Aide'} },
          { path: 'login', component: LoginComponent , data:{state:'login', title:'Connexion'}}
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
  ]
})
export class PublicRoutingModule {
}
