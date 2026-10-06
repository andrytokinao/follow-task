import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {catchError, map, of} from 'rxjs';
import {AuthGuard} from '../../../services/SystemGuard';

/** Permission portée par le rôle système DIRECTION (voir application.yml). */
export const PERMISSION_DIRECTION = 'CAN_VIEW_DIRECTION';

/**
 * Accès au cockpit de direction. Le profil est relu à chaque entrée, pour
 * qu'un rôle DIRECTION attribué en cours de session soit pris en compte.
 */
export const directionGuard: CanActivateFn = () => {
  const authGuard = inject(AuthGuard);
  const router = inject(Router);
  return authGuard.hasAutorityAsync([PERMISSION_DIRECTION]).pipe(
    catchError(() => of(false)),
    map(autorise => autorise || router.createUrlTree(['/working/access-denied']))
  );
};
