import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree} from '@angular/router';
import {Observable, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {EspaceDirectionService} from './espace-direction.service';

/**
 * `/direction/:espace` : active l'espace de l'adresse. Un préfixe inconnu mène
 * à l'espace par défaut, sur la même page.
 */
export const espaceDirectionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const espaces = inject(EspaceDirectionService);
  const router = inject(Router);
  return espaces.trouver(route.paramMap.get('espace')).pipe(
    switchMap((espace): Observable<boolean | UrlTree> => {
      if (espace) {
        espaces.activer(espace);
        return of(true);
      }
      return versEspaceParDefaut(espaces, router, pageDemandee(route));
    }),
    catchError(() => of(router.createUrlTree(['/direction']))));
};

/** `/direction` : l'accueil couvre tous les espaces, le menu n'en désigne aucun. */
export const accueilDirectionGuard: CanActivateFn = () => {
  inject(EspaceDirectionService).quitter();
  return true;
};

/**
 * Anciennes adresses sans espace (`/direction/gantt`, `/direction/situation`) :
 * la même page, dans l'espace par défaut.
 */
export function versEspaceParDefautGuard(page: string = ''): CanActivateFn {
  return () => versEspaceParDefaut(inject(EspaceDirectionService), inject(Router), page);
}

function versEspaceParDefaut(espaces: EspaceDirectionService, router: Router, page: string): Observable<UrlTree> {
  return espaces.parDefaut().pipe(
    map(espace => espace
      ? router.createUrlTree(['/direction', espace.prefixe, ...(page ? [page] : [])])
      // Aucun espace de travail : il reste l'accueil.
      : router.createUrlTree(['/direction'])),
    catchError(() => of(router.createUrlTree(['/direction']))));
}

/** Page visée sous l'espace (`gantt`, `situation`), vide pour les fiches projets. */
function pageDemandee(route: ActivatedRouteSnapshot): string {
  return route.firstChild?.routeConfig?.path ?? '';
}
