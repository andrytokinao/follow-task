import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {catchError, filter, map, of, take} from 'rxjs';
import {AuthService} from '../../../services/auth.service';
import {peutVoirDirection} from './direction.permissions';

/**
 * Accès au cockpit de direction. Le profil est relu à chaque entrée, pour
 * qu'un rôle DIRECTION attribué en cours de session soit pris en compte.
 */
export const directionGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.getProfile().pipe(
    filter((profile: any) => !!profile),
    take(1),
    map((profile: any) => peutVoirDirection(profile?.permissions)),
    catchError(() => of(false)),
    map(autorise => autorise || router.createUrlTree(['/working/access-denied']))
  );
};
