import {NgModule} from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {ShowMasterComponent} from "./show-master.component";
import {CommentComponent} from "./comment/comment.component";
import {DetailsComponent} from "./details/details.component";
import {SubtaskComponent} from "./subtask/subtask.component";
import {LivraisonComponent} from "./livraison/livraison.component";





const masterRoute: Routes = [
  {
    path: '',
    component: ShowMasterComponent,
    children: [
      {
        path: '',
        children: [
          { path: 'comment', component: CommentComponent },
          { path: 'details', component: DetailsComponent },
          { path: 'subtask', component: SubtaskComponent },
          { path: 'livraison', component: LivraisonComponent },
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
