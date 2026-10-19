import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DirectionComponent} from './direction.component';
import {DirectionGanttProjetsComponent} from './gantt-projets/direction-gantt-projets.component';
import {SituationComponent} from './situation/situation.component';
import {DirectionShellComponent} from './shell/direction-shell.component';
import {DirectionAccueilComponent} from './accueil/direction-accueil.component';
import {accueilDirectionGuard, espaceDirectionGuard, versEspaceParDefautGuard} from './espace/espace-direction.guards';

/**
 * Tout le cockpit est sous le même cadre (menu à gauche) :
 * - `/direction` : l'accueil, tableau de bord de tous les projets ;
 * - `/direction/TOPO`, `/direction/TOPO/gantt`, `/direction/TOPO/situation` :
 *   les pages d'un espace de travail, toujours un seul.
 */
const directionRoutes: Routes = [
  {
    path: '',
    component: DirectionShellComponent,
    children: [
      {path: '', pathMatch: 'full', component: DirectionAccueilComponent, canActivate: [accueilDirectionGuard]},
      // Anciennes adresses, d'avant l'espace obligatoire.
      {path: 'gantt', pathMatch: 'full', canActivate: [versEspaceParDefautGuard('gantt')], children: []},
      {path: 'situation', pathMatch: 'full', canActivate: [versEspaceParDefautGuard('situation')], children: []},
      {
        path: ':espace',
        canActivate: [espaceDirectionGuard],
        children: [
          {path: '', component: DirectionComponent},
          // Tous les projets de l'espace en diagramme de Gantt.
          {path: 'gantt', component: DirectionGanttProjetsComponent},
          // Situation du jour (DT-005) : fiabilité, projets, qui fait quoi maintenant.
          {path: 'situation', component: SituationComponent}
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(directionRoutes)],
  exports: [RouterModule]
})
export class DirectionRoutingModule {
}
