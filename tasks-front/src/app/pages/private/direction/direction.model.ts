import {Issue, User} from '../../../type/issue';

/**
 * Modèle d'affichage du cockpit de direction. Les données viennent de
 * GraphQL (`direction.operations.ts`) et sont mises en forme par
 * `DirectionService`.
 */

/**
 * Espace de travail : le « département » du cockpit. Toujours un seul affiché,
 * désigné dans l'adresse par son préfixe (`/direction/TOPO`).
 */
export interface EspaceDirection {
  /** Nom affiché, et valeur des filtres `departement` du serveur. */
  nom: string;
  prefixe: string;
}

/**
 * Temps occupé par une séance d'une personne (`plagesMembres`), déjà
 * normalisé par le serveur : sans fin, une heure ; « toute la journée », des
 * journées entières. Date-heures ISO.
 */
export interface PlageMembre {
  userId: string;
  debut: string;
  fin: string;
}

/** Même chose sur une tâche (`plagesProjets`) : l'effectif des projets du Gantt. */
export interface PlageTache {
  userId: string;
  issueId: number;
  debut: string;
  fin: string;
}

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
  /** Statut de la demande racine ; null si aucun. */
  statut: { libelle: string; couleur: string | null } | null;
  /** La demande racine telle que reçue, pour `app-assign-field` (assignés). */
  issue: Issue;
}

/** Tâche d'un projet : le type Issue, plus les champs propres au cockpit. */
export type TacheProjet = Issue & {
  /** Début du premier événement de planning commencé ; null si jamais traitée. */
  dateDebutTraitement?: string | null;
  nombreCommentaires?: number;
  /** Fichiers du répertoire de la tâche, sous-dossiers compris. */
  nombrePiecesJointes?: number;
};

export interface DetailProjet {
  taches: TacheProjet[];
}

/** État d'une séance de planning (`ExecutionStatus` côté serveur). */
export type EtatRealisation = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'POSTPONED' | 'EXTENDED';

/** Une séance de travail sur une tâche : une barre du diagramme de Gantt. */
export interface RealisationTache {
  id: number;
  titre: string | null;
  debut: string;
  /** null si la fin n'a pas été renseignée. */
  fin: string | null;
  /** Avancement de la tâche déclaré à l'issue de la séance. */
  avancement: number | null;
  etat: EtatRealisation | null;
  intervenant: User | null;
}

/** Dépendance d'une tâche vers une autre : une flèche du diagramme de Gantt. */
export interface DependanceTache {
  id: number;
  /** BLOCKS, PRECEDES ou TRIGGERS. */
  type: string;
  /** Libellé lu depuis la source : « bloque », « précède », « déclenche ». */
  libelle: string;
  /** Tâche qui dépend de celle-ci ; elle peut être d'un autre projet. */
  destinationId: number;
}

/** Tâche du diagramme de Gantt : le type Issue, plus ses séances et ses dépendances. */
export type TacheGantt = Issue & {
  /** Champ « Date Démarrage » de la tâche ; null s'il n'est pas saisi. */
  dateDemarrage?: string | null;
  /** Champ « Deadline » de la tâche ; null s'il n'est pas saisi. */
  deadline?: string | null;
  /** Début de sa première séance de planning, passée ou à venir ; null sans séance. */
  debutExecution?: string | null;
  realisations?: RealisationTache[];
  dependances?: DependanceTache[];
};

/**
 * Projet du Gantt de direction (`/direction/gantt`) : la demande racine avec
 * ses dates, ses champs personnalisés et ses tâches. Les séances de travail ne
 * sont pas ici : elles viennent de la recherche d'événements (`searchEvents`),
 * ce qui laisse filtrer par personne et par période.
 */
export type ProjetGantt = TacheGantt & {
  children?: TacheGantt[];
  rapportProjet?: {
    departement?: string;
    prefixeDepartement?: string | null;
    avancementGlobal?: number;
    synthese?: { nombreTaches?: number; nombreEnRetard?: number };
  };
};
