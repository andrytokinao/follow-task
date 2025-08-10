import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {PrivateComponent} from "./private.component";
import {ProjectComponent} from "./project/project.component";
import {AdminComponent} from "./admins/admin.component";
import {ProfileComponent} from "./profile/profile.component";
import {AccessDeniedComponent} from "./access-denied/access-denied.component";
import {AuthGuard} from "../../services/SystemGuard";
import {ProjectResolverService} from "../../services/resolvers/project-resolver.service";
import {HomeComponent} from "./home/home.component";
import {ProjectBreadcrumbResolverService} from "./project/project-breadcrumb-resolver.service";
import {ProjectGuard} from "../../services/ProjectGuard";

const privateRoute: Routes = [
  {
    path: '',
    component: PrivateComponent,
        children: [
          { path: '', component: HomeComponent  },
          { path: 'profile', component: ProfileComponent  },
          { path: 'access-denied', component: AccessDeniedComponent },
          {
            path: ':project',resolve:{project:ProjectResolverService,breadcrumb: ProjectBreadcrumbResolverService,},
            loadChildren: () => import('./project/project.module').then(m => m.ProjectModule),
             canActivate: [ProjectGuard] , data:{roles:['USER']}
          }
        ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(privateRoute)],
  exports: [
    RouterModule]
})
export class PrivateRoutingModule {}
