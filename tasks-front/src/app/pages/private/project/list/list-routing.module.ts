import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListComponent} from "./list.component";
import {IssueMasterListComponent} from "./issue-master-list/issue-master-list.component";
import {IssueListeComponent} from "./issue-liste/issue-liste.component";




const list: Routes = [
  {
    path: '',
    component: ListComponent,
    children: [
      {
        path: '',
        children: [
          { path: 'master', component: IssueMasterListComponent },
          { path: 'issue', component: IssueListeComponent },
        ]
      }
    ]
  }
];


@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(list)
  ],
  exports: [
    RouterModule
  ],
  providers: [],
  bootstrap: []
})
export class ListRoutingModule {
}
