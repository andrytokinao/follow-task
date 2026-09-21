/**
 * Compte rendu d'un import d'utilisateurs par tableur, tel que le serveur le
 * renvoie (RapportImportUsers côté Java).
 */

/** Sort d'une ligne du tableur. */
export type StatutLigneImport = 'CREE' | 'CREE_SANS_PHOTO' | 'REJETE';

export interface LigneImportUser {
  /** Numéro de ligne dans le fichier, en-tête compris : les données commencent à 2. */
  ligne: number;
  username: string | null;
  statut: StatutLigneImport;
  /** Motif du rejet, ou avertissement sur la photo ; vide sinon. */
  message: string;
}

export interface RapportImportUsers {
  /** Lignes de données lues, en-tête exclu. */
  total: number;
  crees: number;
  rejetes: number;
  lignes: LigneImportUser[];
}
