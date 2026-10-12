import {EventApp, User} from '../../../../type/issue';
import {ProjetGantt, TacheGantt} from '../direction.model';
import {Segment} from './gantt-fenetre';

/*
 * Ce que dessine le Gantt de direction, en deux couches indépendantes :
 *
 *  - la structure (`BlocGantt`, `LigneGantt`) : projets, tâches, cadres et
 *    champs datés. Elle ne dépend que des projets et de la période ;
 *  - l'activité (`ActiviteTache`) : le réalisé et le planifié, tirés des
 *    événements de planning. Elle seule change quand on choisit une personne.
 *
 * Tout est déjà placé sur l'axe : le gabarit ne calcule rien.
 */

// ------------------------------------------------------------------ structure

/** Champ personnalisé de type Date : une barre verticale. */
export interface RepereGantt {
  gauche: number;
  /** Projet ou tâche qui porte la date : « PRJ-12 · Maquettes ». */
  source: string;
  nom: string;
  couleur: string;
  date: number;
}

/** Du démarrage à la deadline. `segment` est null quand le cadre est hors de la fenêtre. */
export interface CadreGantt {
  debut: number;
  fin: number;
  sansEcheance: boolean;
  segment: Segment | null;
}

/**
 * Une ligne du diagramme : une tâche, ou un groupe de tâches (leur type, par
 * exemple) selon le regroupement choisi.
 */
export interface LigneGantt {
  /** Identifiant de la ligne : l'activité de ses tâches y est rangée. */
  cle: string;
  nom: string;
  /** Les tâches de la ligne ; une seule quand on groupe par tâche. */
  taches: TacheGantt[];
  /** La tâche, quand la ligne en est une ; null pour un groupe. */
  tache: TacheGantt | null;
  /** Avancement de la tâche, ou moyenne de ceux du groupe. */
  avancement: number;
  responsable: User | null;
  /** null sans date de démarrage ni deadline ; pour un groupe, l'étendue de ses tâches. */
  cadre: CadreGantt | null;
  /** Tâche non finie après sa deadline : de la deadline à aujourd'hui. Groupe : son plus long retard. */
  retard: (Segment & { jours: number }) | null;
  reperes: RepereGantt[];
}

export interface BlocGantt {
  projet: ProjetGantt;
  avancement: number;
  nombreTaches: number;
  enRetard: number;
  cadre: CadreGantt | null;
  /** Part du cadre déjà faite, d'après l'avancement global. */
  rempli: Segment | null;
  reperes: RepereGantt[];
  lignes: LigneGantt[];
}

/** Champ personnalisé de la légende, avec la couleur de ses barres. */
export interface ChampGantt {
  id: number;
  nom: string;
  couleur: string;
}

// ------------------------------------------------------------------ activité

/** Événement de planning situé dans le temps. */
export interface Seance {
  evenement: EventApp;
  debut: number;
  fin: number;
  /** Fin de ce qui a réellement été fait ; null si rien (à venir, bloquée, reportée). */
  finReelle: number | null;
}

/** Suite de jours travaillés sans interruption. */
export interface Serie {
  debut: number;
  fin: number;
  personnes: User[];
  seances: Seance[];
}

/** Une partie du réalisé : mêmes personnes au travail d'un bout à l'autre. */
export interface PartieGantt extends Segment {
  serie: Serie;
  /** Pastille du nombre de personnes ; masquée si elle chevaucherait la précédente. */
  pastille: boolean;
  centre: number;
}

/**
 * Ce qu'il reste de planifié à une personne sur la tâche : un cadre en pointillé,
 * sur sa voie. Une séance passée n'est plus ici : elle est devenue du réalisé.
 */
export interface PlanGantt extends Segment {
  serie: Serie;
  personne: User;
  voie: number;
}

/** Activité d'une ligne sur la période : ce que les événements de planning de ses tâches donnent à voir. */
export interface ActiviteTache {
  parties: PartieGantt[];
  plans: PlanGantt[];
  /** Nombre de voies de planification : une par personne. */
  voies: number;
  /** Personnes ayant au moins une séance, faite ou à venir. */
  personnes: User[];
}
