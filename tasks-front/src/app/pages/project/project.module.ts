import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {StatusComponent} from "./status/status.component";
import {RepartitionComponent} from "./repartition/repartition.component";
import {IssueListeComponent} from "./issue-liste/issue-liste.component";
import {ProjectComponent} from "./project.component";
import {ProjectRoutingModule} from "./project-routing.module";
import {GanttChartComponent} from "./gantt-chart/gantt-chart.component";

@NgModule({
  declarations: [StatusComponent, RepartitionComponent, IssueListeComponent, ProjectComponent,GanttChartComponent],
  exports: [
     StatusComponent, RepartitionComponent, IssueListeComponent,ProjectComponent
  ],
  imports: [
    CommonModule,
    ProjectRoutingModule,
    CommonModule,
  ]
})
export class ProjectModule { }
