import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {PlanningComponent} from "./planning.component";
import {ProfileComponent} from "../../profile/profile.component";
import {AccessDeniedComponent} from "../../access-denied/access-denied.component";
import {RouterModule, Routes} from "@angular/router";
import {PlanningCalendarComponent} from "./planning-calendar/planning-calendar.component";
import {PlanningResourcesComponent} from "./planning-resources/planning-resources.component";


const planningRoute:Routes = [
  {
    path:'',
    component:PlanningComponent,
    children:[
      {
        path:'',
        children:[
          { path: 'resources', component: PlanningResourcesComponent  },
          { path: 'calendar', component: PlanningCalendarComponent },
        ]
      }
    ]

  }
]
@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(planningRoute)
  ],
  exports:[
    RouterModule
  ]
})
export class PlanningRoutingModule { }
