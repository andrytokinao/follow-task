import {NgModule} from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {ShowMasterComponent} from "./show-master.component";
import {SubtaskComponent} from "./subtask/subtask.component";
import {LivraisonComponent} from "./livraison/livraison.component";
import {IssueDetailsComponent} from "./issue-details/issue-details.component";





const masterRoute: Routes = [
  {
    path: '',
    component: ShowMasterComponent,
    children: [
      {
        path: '',
        children: [
          { path: 'details', component: IssueDetailsComponent },
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
