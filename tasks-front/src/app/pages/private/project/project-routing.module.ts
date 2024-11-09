import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {IssueListeComponent} from "./list/issue-liste/issue-liste.component";
import {ProjectComponent} from "./project.component";
import {GanttChartComponent} from "./gantt-chart/gantt-chart.component";
import {BoardComponent} from "./board/board.component";
import {CalendarComponent} from "./calendar/calendar.component";
import {RapportComponent} from "./rapport/rapport.component";
import {ConfigProjectComponent} from "./config-project/config-project.component";
import {ShowMasterComponent} from "./show-master/show-master.component";
import {IssueResolverService} from "../../../services/resolvers/issue-resolver.service";
import {IssueMasterListComponent} from "./list/issue-master-list/issue-master-list.component";
import {ListComponent} from "./list/list.component";
import {AdminComponent} from "../admins/admin.component";
import {AuthGuard} from "../../../services/authorization.service.ts";



const projectRoute: Routes = [
  {
    path: '',
    component: ProjectComponent,
    children: [
      {
        path: '',
        children: [
          {path: 'list', component: ListComponent  }, {
            path: 'list',
            loadChildren: () => import('./list/list.module').then(m => m.ListModule),
            //  canMatch: [userAdmin]
          },
          { path: 'gantt-chart', component: GanttChartComponent },
          { path: 'board', component: BoardComponent },
          { path: 'rapport', component: RapportComponent },
          { path: 'calendar', component: CalendarComponent},
          { path: 'config', component: ConfigProjectComponent},
          { path: 'config', loadChildren:()=> import("./config-project/config-project.module") .then(m=>m.ConfigProjectModule)},
          { path: 'issue/:parrentIssue', component: ShowMasterComponent , resolve:{parrentIssue:IssueResolverService}},
          { path: 'issue/:parrentIssue',resolve:{parrentIssue:IssueResolverService},
            loadChildren: () => import('./show-master/issue-master.module').then(m => m.IssueMasterModule),
          },
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
