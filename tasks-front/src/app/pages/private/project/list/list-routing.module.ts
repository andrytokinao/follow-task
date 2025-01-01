import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListComponent} from "./list.component";
import {IssueMasterListComponent} from "./issue-master-list/simple-liste/issue-master-list.component";
import {SimpleListeComponent} from "./subtask-list/issue-liste/simple-liste.component";
import {ShowListComponent} from "./subtask-list/show-list.component";
import {ShowMasterListComponent} from "./issue-master-list/show-master-list/show-master-list.component";




const list: Routes = [
  {
    path: '',
    component: ListComponent,
    children: [
      {
        path: '',
        children: [
          { path: '',   redirectTo: 'master', pathMatch: 'full'  },
          { path: 'master', component: ShowMasterListComponent , title:'Liste des projet' },
          { path: 'issue', component: ShowListComponent ,  title:'Mes tache' },
          { path: 'search-issue', component: ShowListComponent ,  title:'Recherche des taches ' },
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
