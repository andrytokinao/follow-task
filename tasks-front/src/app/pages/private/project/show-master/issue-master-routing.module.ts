import {NgModule} from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {ShowMasterComponent} from "./show-master.component";
import {SubtaskComponent} from "./subtask/subtask.component";
import {UploadedFilesComponent} from "./uploaded-file/uploaded-files.component";
import {IssueDetailsComponent} from "./issue-details/issue-details.component";
import {PlanningComponent} from "./planning/planning.component";
import {FileListComponent} from "./file-list/file-list.component";
import {DossierSourceComponent} from "./dossier-sources/dossier-source.component";
import {CommentsComponent} from "./comments/comments.component";
import {IssueChatsComponent} from "./issue-chats/issue-chats.component";
import {ExchangeDocumentsComponent} from "../exchange-documents/exchange-documents.component";
import {DiscussionComponent} from "./discussion/discussion.component";
import {Subtask2Component} from "./subtask-2/subtask-2.component";





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
          { path: 'subtask', component: Subtask2Component },
          { path: 'planning', component: PlanningComponent },
          { path: 'uploaded', component: UploadedFilesComponent },
          { path: 'comments', component: CommentsComponent },
          { path: 'discussion', component: DiscussionComponent },
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
