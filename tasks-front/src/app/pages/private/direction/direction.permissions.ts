/**
 * Règles d'accès liées à la direction, lues dans les permissions du profil.
 */

/**
 * Permission du cockpit de direction : portée par le rôle système DIRECTION
 * et par SYSTEM_ADMIN (voir application.yml).
 */
export const PERMISSION_DIRECTION = 'CAN_VIEW_DIRECTION';

export function peutVoirDirection(permissions: string[] | null | undefined): boolean {
  return !!permissions && permissions.includes(PERMISSION_DIRECTION);
}

/** Administrateur du système (super admin). */
export function estAdminSysteme(permissions: string[] | null | undefined): boolean {
  return !!permissions && ['SYSTEM_ADMIN', 'CAN_ACCESS_ALL'].some(p => permissions.includes(p));
}
