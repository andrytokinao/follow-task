import {NgModule} from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {ShowMasterComponent} from "./show-master.component";
import {SubtaskComponent} from "./subtask/subtask.component";
import {LivraisonComponent} from "./livraison/livraison.component";
import {IssueDetailsComponent} from "./issue-details/issue-details.component";
import {PlanningComponent} from "./planning/planning.component";
import {FileListComponent} from "./file-list/file-list.component";
import {DossierSourceComponent} from "./dossier-sources/dossier-source.component";
import {CommentsComponent} from "./comments/comments.component";
import {IssueChatsComponent} from "./issue-chats/issue-chats.component";





const masterRoute: Routes = [
  {
    path: '',
    component: ShowMasterComponent,
    children: [
      {
        path: '',
        children: [
          { path: 'details', component: IssueDetailsComponent },
          { path: 'sources-files', component: DossierSourceComponent },
          { path: 'subtask', component: SubtaskComponent },
          { path: 'planning', component: PlanningComponent },
          { path: 'livraison', component: LivraisonComponent },
          { path: 'comments', component: CommentsComponent },
          { path: 'chats', component: IssueChatsComponent },
          {path:'espace-livraison',component:FileListComponent}
        ]
      }
    ]
  }
];


@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(masterRoute)
  ],
  exports: [
    RouterModule
  ],
  providers: [],
  bootstrap: []
})
export class IssueMasterRoutingModule {
}
