import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {CreateProjectComponent} from "./create-project.component";
import {ProjectNameComponent} from "./project-name/project-name.component";


const createProject: Routes = [
  {
    path: '',
    component: CreateProjectComponent,
    children: [
      {
        path: '',
        children: [
          { path: '', redirectTo: "title", pathMatch : "prefix"  },
          { path: 'title', component: ProjectNameComponent  },
          { path: 'work-flow', component: ProjectNameComponent  },
        ]
      }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(createProject)],
  exports: [
    RouterModule]
})
export class CreateProjectRoutingModule { }
