import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {PlanningComponent} from "./planning.component";
import {PlanningResourcesComponent} from "./planning-resources/planning-resources.component";
import {PlanningCalendarComponent} from "./planning-calendar/planning-calendar.component";
import {RouterOutlet} from "@angular/router";
import {PlanningRoutingModule} from "./planning-routing.module";
import {DayPilotModule} from "@daypilot/daypilot-lite-angular";



@NgModule({
  declarations: [
    PlanningResourcesComponent,
    PlanningCalendarComponent,
    PlanningComponent
  ],
  imports: [
    CommonModule,
    RouterOutlet,
    PlanningRoutingModule,
    DayPilotModule
  ]
})
export class PlanningModule { }
