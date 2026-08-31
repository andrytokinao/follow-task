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
import {DocumentExchangeComponent} from "./document-exchange/document-exchange.component";
import {MessagingPageComponent} from "./messaging-page/messaging-page.component";



const projectRoute: Routes = [
  {
    path: '',
    component: ProjectComponent,
    children: [
      {
        path: '',
        children: [
          {
            path: 'list',
            data:{order:1, title:'Liste'},
            loadChildren: () => import('./list/list.module').then(m => m.ListModule),
            //  canMatch: [userAdmin]
          },
          { path: 'home', component: ProjectHomeComponent, data:{title:'Accueil'}},

          { path: 'gantt-chart', component: GanttChartComponent, resolve: { breadcrumb: ProjectBreadcrumbResolverService ,data:{order:2}  }, data:{title:'Gantt'}},
          { path: 'board', component: BoardComponent, resolve: { breadcrumb: ProjectBreadcrumbResolverService  } ,data:{order:3, title:'Tableau'} },
          { path: 'rapport', component: RapportComponent, resolve: { breadcrumb: ProjectBreadcrumbResolverService  } ,data:{order:4, title:'Rapports'} },
          { path: 'calendar', component: CalendarComponent , resolve: { breadcrumb: ProjectBreadcrumbResolverService  } , data:{order:5, title:'Calendrier'}},
          { path: 'correspondants', component: DocumentExchangeComponent ,resolve: { breadcrumb: ProjectBreadcrumbResolverService  },data:{order:6, title:'Correspondants'} },
          {
            path:'planning',data:{order:7, title:'Planning'},
            loadChildren:()=> import('./planning/planning.module').then(m=>m.PlanningModule),
          },
          { path: 'document', component: DocumentComponent , resolve: { breadcrumb: ProjectBreadcrumbResolverService ,data:{order:8}  }, data:{title:'Documents'}},
          { path: 'config', loadChildren:()=> import("./config-project/config-project.module") .then(m=>m.ConfigProjectModule), data:{order:10, title:'Configuration'}},
          { path: 'issue/:parrentIssue', component: ShowMasterComponent , resolve:{parrentIssue:IssueResolverService , breadcrumb: ProjectBreadcrumbResolverService},data:{order:11}},
          { path: 'issue/:parrentIssue',resolve:{parrentIssue:IssueResolverService ,breadcrumb: ProjectBreadcrumbResolverService,},data:{order:12},
            loadChildren: () => import('./show-master/issue-master.module').then(m => m.IssueMasterModule),
          },
          { path: 'messages', component: MessagesComponent , resolve: { breadcrumb: ProjectBreadcrumbResolverService  } , canActivate :[ProjectGuard] , data:{order:13, title:'Messages'  }},
          { path: 'messaging', component: MessagingPageComponent , resolve: { breadcrumb: ProjectBreadcrumbResolverService  } , canActivate :[ProjectGuard] , data:{order:14, title:'Messagerie'  }},
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
