import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {catchError, filter, map, of, take} from 'rxjs';
import {AuthService} from '../../../services/auth.service';

/** Permission portée par le rôle système DIRECTION (voir application.yml). */
export const PERMISSION_DIRECTION = 'CAN_VIEW_DIRECTION';

/**
 * Permissions ouvrant le cockpit : la direction, l'administrateur du système
 * et le super-administrateur (CAN_ACCESS_ALL). Une seule suffit.
 */
export const PERMISSIONS_ACCES_DIRECTION = [PERMISSION_DIRECTION, 'SYSTEM_ADMIN', 'CAN_ACCESS_ALL'];

export function peutVoirDirection(permissions: string[] | null | undefined): boolean {
  return !!permissions && PERMISSIONS_ACCES_DIRECTION.some(p => permissions.includes(p));
}

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
