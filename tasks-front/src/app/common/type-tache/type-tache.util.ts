import {IssueType, Status} from '../../type/issue';

/**
 * Apparence d'une tâche : icône et couleur de son type, couleur de son statut.
 * Une seule règle pour tous les écrans ; les replis servent tant qu'un type ou
 * un statut n'a pas encore reçu d'icône ou de couleur.
 */

/** Gris des types et statuts sans couleur. */
export const COULEUR_NEUTRE = '#6b7280';

/** Classe Font Awesome de l'icône du type ; à défaut, dossier pour une demande, fiche pour une tâche. */
export function iconeDuType(type: IssueType | null | undefined): string {
  const valeur = type?.icone?.typeIcone === 'class' || !type?.icone?.typeIcone ? type?.icone?.value : null;
  if (valeur) {
    return String(valeur);
  }
  return type?.level === 'PARENT' ? 'fa-solid fa-folder' : 'fa-solid fa-file-lines';
}

export function couleurDuType(type: IssueType | null | undefined): string {
  return String(type?.color || COULEUR_NEUTRE);
}

export function couleurDuStatut(status: Status | null | undefined): string {
  return String(status?.color || COULEUR_NEUTRE);
}
