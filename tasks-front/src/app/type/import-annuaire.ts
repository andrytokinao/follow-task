/**
 * Import d'utilisateurs depuis un annuaire externe (ApercuImportAnnuaire et
 * DemandeImportAnnuaire côté Java). Le rapport final est le même que pour le
 * tableur : RapportImportUsers.
 */

export interface ProfilExterne {
  source: string;
  idExterne: string;
  nom: string;
  prenoms: string;
  email: string | null;
  telephone: string | null;
  cin: string | null;
  adresse: string | null;
  poste: string | null;
  photoUrl: string | null;
}

export interface CorrespondanceUtilisateur {
  id: string;
  username: string;
  nomComplet: string;
  email: string | null;
  actif: boolean;
  /** Ce qui rapproche les deux fiches : « même email », « même nom et prénom »… */
  critere: string;
  /** Vrai : c'est la même personne. Faux : homonyme possible, à confirmer. */
  bloquante: boolean;
}

export type VerdictImportAnnuaire = 'NOUVEAU' | 'A_CONFIRMER' | 'DEJA_PRESENT' | 'ILLISIBLE';

export interface ApercuImportAnnuaire {
  reference: string;
  profil: ProfilExterne | null;
  verdict: VerdictImportAnnuaire;
  correspondances: CorrespondanceUtilisateur[];
  erreur: string | null;
}

export interface DemandeImportAnnuaire {
  references: string[];
  /** Références créées malgré un homonyme. */
  confirmees: string[];
  /** Mot de passe donné à tous les comptes créés. */
  motDePasse: string;
}
