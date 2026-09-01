import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy} from '@angular/router';
import {PageTitleService} from './page-title.service';

/**
 * Titre par défaut appliqué à chaque navigation.
 *
 * Il est déduit des libellés statiques posés dans le `data.title` des routes
 * (et du `title` natif d'Angular, si utilisé), plus le préfixe du projet quand
 * l'URL en contient un.
 *
 * Les écrans dont le titre dépend d'une donnée chargée après la navigation —
 * l'issue master, qui attend son résumé — écrasent ensuite ce titre eux-mêmes
 * via {@link PageTitleService}. L'ordre joue en leur faveur : cette stratégie
 * s'exécute à la fin de la navigation, leur donnée arrive après.
 */
@Injectable({providedIn: 'root'})
export class AppTitleStrategy extends TitleStrategy {

  constructor(private readonly pageTitle: PageTitleService) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.pageTitle.set(...this.collectLabels(snapshot.root));
  }

  /**
   * Parcourt la branche active de la racine vers la feuille, puis inverse :
   * le segment le plus spécifique doit apparaître en premier dans l'onglet.
   */
  private collectLabels(root: ActivatedRouteSnapshot): string[] {
    const labels: string[] = [];
    let projectPrefix: string | null = null;

    for (let route: ActivatedRouteSnapshot | null = root; route; route = route.firstChild) {
      // `route.title` couvre la propriété `title` native d'Angular,
      // `data['title']` la convention utilisée dans ce projet.
      const label = route.title ?? route.data?.['title'];
      if (typeof label === 'string' && label.trim().length > 0) {
        labels.push(label.trim());
      }

      // Le préfixe du projet sert de contexte commun à tous ses écrans.
      projectPrefix = route.paramMap.get('project') ?? projectPrefix;
    }

    if (projectPrefix) {
      labels.unshift(projectPrefix);
    }

    // Angular recopie le `data` d'une route sans composant vers ses enfants :
    // sans ce filtre, un même libellé apparaîtrait deux fois.
    const deduplicated = labels.filter((label, index) => labels.indexOf(label) === index);

    return deduplicated.reverse();
  }
}
