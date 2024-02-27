import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {IssueListeComponent} from "./issue-liste/issue-liste.component";
import {ProjectComponent} from "./project.component";
import {RepartitionComponent} from "./repartition/repartition.component";
import {StatusComponent} from "./status/status.component";
import {GanttChartComponent} from "./gantt-chart/gantt-chart.component";
import {BoardComponent} from "./board/board.component";

const projectRoute: Routes = [
  {
    path: '',
    component: ProjectComponent,
    children: [
      {
        path: '',
        children: [
          { path: '',   redirectTo: 'liste', pathMatch: 'full' },
          { path: 'liste', component: IssueListeComponent },
          { path: 'gantt-chart', component: GanttChartComponent },
          { path: 'board', component: BoardComponent },

        ]
      }
    ]
  }
];


@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(projectRoute)
  ],
  exports: [
    RouterModule
  ],
  providers: [],
  bootstrap: []
})
export class ProjectRoutingModule {
}
