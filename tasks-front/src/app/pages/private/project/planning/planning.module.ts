import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {PlanningComponent} from "./planning.component";
import {PlanningResourcesComponent} from "./planning-resources/planning-resources.component";
import {PlanningCalendarComponent} from "./planning-calendar/planning-calendar.component";
import {RouterOutlet} from "@angular/router";
import {PlanningRoutingModule} from "./planning-routing.module";
import {DayPilotModule} from "@daypilot/daypilot-lite-angular";
import {FormsModule} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {MatStepLabel, MatStepperNext} from "@angular/material/stepper";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {MyCommonModule} from "../../../../common/common.module";
import {ProjectModule} from "../project.module";
import {UserAvatarComponent} from "../../../../common/user-avatar/user-avatar.component";



@NgModule({
    declarations: [
        PlanningResourcesComponent,
        PlanningCalendarComponent,
        PlanningComponent
    ],
    exports: [
        PlanningCalendarComponent
    ],
    imports: [
        CommonModule,
        RouterOutlet,
        PlanningRoutingModule,
        DayPilotModule,
        FormsModule,
        MatButton,
        UserAvatarComponent,
        MatStepLabel,
        MatStepperNext,
        MatMenu,
        MyCommonModule,
        MatMenuTrigger,
        ProjectModule
    ]
})
export class PlanningModule { }
