import {Issue, User} from '../../../type/issue';

/**
 * Modèle d'affichage du cockpit de direction. Les données viennent de
 * GraphQL (`direction.operations.ts`) et sont mises en forme par
 * `DirectionService`.
 */

/** Un projet : demande racine en cours, avec les chiffres de son rapport. */
export interface ProjetDirection {
  id: number;
  /** Clé de la demande racine (« PRJ-12 »). */
  cle: string;
  nom: string;
  departement: string;
  /** Préfixe de l'espace de travail, pour les liens vers le projet. */
  prefixeDepartement: string | null;
  avancement: number;
  nombreTaches: number;
  tachesEnRetard: number;
}

/** Tâche d'un projet : le type Issue, plus sa date de premier traitement. */
export type TacheProjet = Issue & {
  /** Début du premier événement de planning commencé ; null si jamais traitée. */
  dateDebutTraitement?: string | null;
};

/** Temps d'une personne sur une tâche (`getIssuePlanningSummaries`). */
export interface TempsPersonne {
  user: User;
  spentMinutes: number;
  totalMinutes: number;
}

export interface DetailProjet {
  taches: TacheProjet[];
  /** Temps par personne, indexé par identifiant de tâche. */
  tempsParTache: Map<number, TempsPersonne[]>;
}
