import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {IssueListeComponent} from "./issue-liste/issue-liste.component";
import {ProjectComponent} from "./project.component";
import {GanttChartComponent} from "./gantt-chart/gantt-chart.component";
import {BoardComponent} from "./board/board.component";
import {CalendarComponent} from "./calendar/calendar.component";
import {RapportComponent} from "./rapport/rapport.component";
import {ConfigProjectComponent} from "./config-project/config-project.component";

const projectRoute: Routes = [
  {
    path: '',
    component: ProjectComponent,
    children: [
      {
        path: '',
        children: [
          { path: 'liste', component: IssueListeComponent },
          { path: 'gantt-chart', component: GanttChartComponent },
          { path: 'board', component: BoardComponent },
          { path: 'rapport', component: RapportComponent },
          { path: 'calendar', component: CalendarComponent},
          { path: 'config', component: ConfigProjectComponent},
          { path: 'config', component: ConfigProjectComponent},
          { path: 'config', loadChildren:()=> import("./config-project/config-project.module") .then(m=>m.ConfigProjectModule)},

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
