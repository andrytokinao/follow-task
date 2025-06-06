import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SimpleListeComponent} from "./list/subtask-list/issue-liste/simple-liste.component";
import {ProjectComponent} from "./project.component";
import {GanttChartComponent} from "./gantt-chart/gantt-chart.component";
import {BoardComponent} from "./board/board.component";
import {CalendarComponent} from "./calendar/calendar.component";
import {RapportComponent} from "./rapport/rapport.component";
import {ConfigProjectComponent} from "./config-project/config-project.component";
import {ShowMasterComponent} from "./show-master/show-master.component";
import {IssueResolverService} from "../../../services/resolvers/issue-resolver.service";
import {IssueMasterListComponent} from "./list/issue-master-list/simple-liste/issue-master-list.component";
import {ListComponent} from "./list/list.component";
import {AdminComponent} from "../admins/admin.component";
import {AuthGuard} from "../../../services/SystemGuard";
import {DocumentComponent} from "./document/document.component";
import {ProjectBreadcrumbResolverService} from "./project-breadcrumb-resolver.service";
import {PlanningComponent} from "./planning/planning.component";
import {PlanningModule} from "./planning/planning.module";
import {ProjectGuard} from "../../../services/ProjectGuard";
import _default from "chart.js/dist/core/core.interaction";
import dataset = _default.modes.dataset;
import {MessagesComponent} from "./messages/messages.component";
import {ProjectHomeComponent} from "./home/home.component";



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
            data:{order:1},
            loadChildren: () => import('./list/list.module').then(m => m.ListModule),
            //  canMatch: [userAdmin]
          },
          { path: 'home', component: ProjectHomeComponent},

          { path: 'gantt-chart', component: GanttChartComponent, resolve: { breadcrumb: ProjectBreadcrumbResolverService ,data:{order:2}  }},
          { path: 'board', component: BoardComponent, resolve: { breadcrumb: ProjectBreadcrumbResolverService  } ,data:{order:3} },
          { path: 'rapport', component: RapportComponent, resolve: { breadcrumb: ProjectBreadcrumbResolverService  } ,data:{order:4} },
          { path: 'calendar', component: CalendarComponent , resolve: { breadcrumb: ProjectBreadcrumbResolverService  } , data:{order:5}},
          { path: 'planning', component: PlanningComponent , resolve: { breadcrumb: ProjectBreadcrumbResolverService  } , data:{order:6}},
          {
            path:'planning',data:{order:7},
            loadChildren:()=> import('./planning/planning.module').then(m=>m.PlanningModule),
          },
          { path: 'document', component: DocumentComponent , resolve: { breadcrumb: ProjectBreadcrumbResolverService ,data:{order:8}  }},
          { path: 'config', component: ConfigProjectComponent , resolve: { breadcrumb: ProjectBreadcrumbResolverService  } , canActivate :[ProjectGuard] , data:{order:9}},
          { path: 'config', loadChildren:()=> import("./config-project/config-project.module") .then(m=>m.ConfigProjectModule), data:{order:10}},
          { path: 'issue/:parrentIssue', component: ShowMasterComponent , resolve:{parrentIssue:IssueResolverService , breadcrumb: ProjectBreadcrumbResolverService},data:{order:11}},
          { path: 'issue/:parrentIssue',resolve:{parrentIssue:IssueResolverService ,breadcrumb: ProjectBreadcrumbResolverService,},data:{order:12},
            loadChildren: () => import('./show-master/issue-master.module').then(m => m.IssueMasterModule),
          },
          { path: 'messages', component: MessagesComponent , resolve: { breadcrumb: ProjectBreadcrumbResolverService  } , canActivate :[ProjectGuard] , data:{order:13  }},
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
