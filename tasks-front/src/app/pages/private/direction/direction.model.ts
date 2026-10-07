import {Issue} from '../../../type/issue';

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
  /** Heures passées sur l'ensemble des tâches (synthèse du rapport). */
  heures: number;
}

/** Tâche d'un projet : le type Issue, plus les champs propres au cockpit. */
export type TacheProjet = Issue & {
  /** Début du premier événement de planning commencé ; null si jamais traitée. */
  dateDebutTraitement?: string | null;
  nombreCommentaires?: number;
};

export interface DetailProjet {
  taches: TacheProjet[];
}
