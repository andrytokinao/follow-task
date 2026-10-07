import {DocumentApp, Issue, User} from '../../../type/issue';

/**
 * Contrat de données du cockpit de direction.
 *
 * Modèle d'affichage des écrans. Les données viennent de GraphQL
 * (`direction.operations.ts`) et sont mises en forme par `DirectionService`.
 */

export type PeriodeDirection = 'semaine' | 'mois' | 'trimestre';

export interface FiltresDirection {
  /** null : toute la société. */
  departement: string | null;
  periode: PeriodeDirection;
}

/** Santé d'un projet, lue d'abord par l'icône et le libellé, puis par la couleur. */
export type SanteProjet = 'BON' | 'VIGILANCE' | 'CRITIQUE';

export type NiveauAlerte = 'VIGILANCE' | 'SERIEUX' | 'CRITIQUE';

export interface IndicateurCle {
  code: string;
  libelle: string;
  valeur: number;
  unite?: string;
  /** Valeur de la période précédente, pour la tendance ; null sans historique. */
  valeurPrecedente: number | null;
  /** true si une hausse est une bonne nouvelle (temps productif), false sinon (retards). */
  hausseFavorable: boolean;
  aide: string;
}

export interface ChargeSemaine {
  /** Libellé court de la semaine, ex. « S41 ». */
  semaine: string;
  /** Charge planifiée en % de la capacité de la personne. */
  pourcentage: number;
  heuresPlanifiees: number;
  capacite: number;
}

export interface ChargePersonne {
  id: number;
  nom: string;
  initiales: string;
  poste: string;
  departement: string;
  semaines: ChargeSemaine[];
}

export interface ProjetPortefeuille {
  id: number;
  prefixe: string;
  nom: string;
  /** null : le modèle ne porte pas encore de client. */
  client: string | null;
  departement: string;
  /** Préfixe de l'espace de travail, pour les liens vers le projet. */
  prefixeDepartement?: string | null;
  /** null si aucun responsable n'est désigné. */
  chefProjet: string | null;
  sante: SanteProjet;
  avancement: number;
  heuresPrevues: number;
  heuresReelles: number;
  tachesOuvertes: number;
  tachesEnRetard: number;
  prochaineEcheance: { libelle: string; echeance: string } | null;
}

export interface AlerteDirection {
  niveau: NiveauAlerte;
  titre: string;
  detail: string;
  /** Lien interne pour agir : projet ou personne concerné. */
  lien?: string[];
}

/** Répartition du temps réel saisi, en heures, par nature d'activité. */
export interface RepartitionTemps {
  departement: string;
  missions: number;
  interne: number;
  commercial: number;
}

// ---------------------------------------------------------------------------
// Détail d'un projet, lu en GraphQL sur les requêtes existantes
// ---------------------------------------------------------------------------

/** Tâche du projet : le type Issue, plus sa date de premier traitement. */
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
  /** Fichiers finaux du menu « Livrable » (documents DONNE_FILE). */
  livrables: DocumentApp[];
}

export interface VueEnsembleDirection {
  miseAJour: string;
  departements: string[];
  indicateurs: IndicateurCle[];
  /** null : pas encore mesuré. À distinguer d'une liste vide (personne dans le périmètre). */
  charges: ChargePersonne[] | null;
  projets: ProjetPortefeuille[];
  alertes: AlerteDirection[];
  /** null : pas encore mesuré. */
  repartition: RepartitionTemps[] | null;
}
