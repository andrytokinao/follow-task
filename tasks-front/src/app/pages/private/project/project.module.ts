import {ChangeDetectorRef, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import {StatusComponent} from "./status/status.component";
import {RepartitionComponent} from "./repartition/repartition.component";
import {IssueListeComponent} from "./issue-liste/issue-liste.component";
import {ProjectComponent} from "./project.component";
import {ProjectRoutingModule} from "./project-routing.module";
import {GanttChartComponent} from "./gantt-chart/gantt-chart.component";
import {BoardComponent} from "./board/board.component";
import {NewIssueComponent} from "./modal/new-issue/new-issue.component";
import {MatTabsModule} from "@angular/material/tabs";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule} from "@angular/forms";
import {MatMenuModule, MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {BrowserModule} from "@angular/platform-browser";
import {MatIconModule} from "@angular/material/icon";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ViewEditIssueComponent} from "./modal/view-edit-issue/view-edit-issue.component";
import {MatSelectModule} from "@angular/material/select";
import {MyCommonModule} from "../../../common/common.module";
import {CalendarComponent} from "./calendar/calendar.component";
import {RapportComponent} from "./rapport/rapport.component";

@NgModule({
  declarations: [
    StatusComponent,
    RepartitionComponent,
    IssueListeComponent,
    ProjectComponent,
    GanttChartComponent,
    BoardComponent,
    CalendarComponent,
    RapportComponent,
    NewIssueComponent,
    ViewEditIssueComponent],
  exports: [
     StatusComponent, RepartitionComponent, IssueListeComponent,ProjectComponent
  ],
  imports: [
    ProjectRoutingModule,
    MatTabsModule,
    MatCardModule,
    MatDialogModule,
    MatToolbarModule,
    MatFormFieldModule,
    FormsModule,
    MatMenuModule,
    MatMenuModule,
    MatIconModule,
    MatSelectModule,
    CommonModule,
    MyCommonModule,
  ]
})
export class ProjectModule { }
