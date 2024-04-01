import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {UsersComponent} from "./users/users.component";
import {GroupsComponent} from "./groups/groups.component";
import {ParametersComponent} from "./parameters/parameters.component";
import {AdminComponent} from "./admin.component";
import {NotFoundComponent} from "../../not-found/not-found.component";

const adminRoute: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        children: [
          { path: '',   redirectTo: 'users', pathMatch: 'full' },
          { path: 'users', component: UsersComponent},
          { path: 'groups', component: GroupsComponent },
          { path: 'parameters', component: ParametersComponent  },
          { path: '**',   component: NotFoundComponent },
        ]
      }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(adminRoute)],
  exports: [
    RouterModule]
})
export class AdminRoutingModule { }
