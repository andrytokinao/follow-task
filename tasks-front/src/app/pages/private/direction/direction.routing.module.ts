import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DirectionComponent} from './direction.component';
import {DirectionOverviewComponent} from './overview/direction-overview.component';
import {DirectionPlaceholderComponent} from './placeholder/direction-placeholder.component';

const directionRoutes: Routes = [
  {
    path: '',
    component: DirectionComponent,
    children: [
      {path: '', redirectTo: 'overview', pathMatch: 'full'},
      {
        path: 'overview', component: DirectionOverviewComponent,
        data: {titre: 'Vue d\'ensemble', sousTitre: 'L\'essentiel de la société en un coup d\'œil'}
      },
      {
        path: 'projets', component: DirectionPlaceholderComponent,
        data: {
          titre: 'Projets', sousTitre: 'Portefeuille et livrables', icone: 'fas fa-briefcase',
          promesse: 'Chaque projet en détail : tâches, livrables et leur validation, équipe mobilisée, temps prévu face au temps réel.'
        }
      },
      {
        path: 'equipes', component: DirectionPlaceholderComponent,
        data: {
          titre: 'Équipes', sousTitre: 'Charge par personne', icone: 'fas fa-users',
          promesse: 'La fiche de charge de chaque collaborateur : tâches en cours, échéances, temps saisi, pour réaffecter ou renforcer au bon moment.'
        }
      },
      {
        path: 'departements', component: DirectionPlaceholderComponent,
        data: {
          titre: 'Départements', sousTitre: 'Comparaison des pôles', icone: 'fas fa-sitemap',
          promesse: 'Les départements côte à côte : effectif, charge, part du temps consacrée aux missions clients.'
        }
      },
      {
        path: 'activites', component: DirectionPlaceholderComponent,
        data: {
          titre: 'Activités internes', sousTitre: 'Tâches hors mission', icone: 'fas fa-building',
          promesse: 'Les tâches confiées hors projet client — communication, administratif, formation — et le temps qu\'elles mobilisent.'
        }
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
