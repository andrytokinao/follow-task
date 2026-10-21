import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {OutilsPageComponent} from './outils-page/outils-page.component';

/** Menu Outils (DT-019) : racine, dossier racine d'un type, dossier. */
const routes: Routes = [
  {path: '', component: OutilsPageComponent},
  {path: ':type', component: OutilsPageComponent},
  {path: ':type/:dossierId', component: OutilsPageComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OutilsRoutingModule {
}
