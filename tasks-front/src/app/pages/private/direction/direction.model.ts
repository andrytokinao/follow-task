/**
 * Contrat de données du cockpit de direction.
 *
 * Ces types décrivent la réponse attendue de `GET api/direction/overview` :
 * des agrégats déjà calculés côté serveur, jamais la liste brute des tâches,
 * pour que l'écran reste instantané quelle que soit la taille de la société.
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
  /** Valeur de la période précédente, pour la tendance. */
  valeurPrecedente: number;
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
  client: string;
  departement: string;
  chefProjet: string;
  sante: SanteProjet;
  avancement: number;
  heuresPrevues: number;
  heuresReelles: number;
  tachesOuvertes: number;
  tachesEnRetard: number;
  prochainLivrable: { libelle: string; echeance: string } | null;
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

export interface VueEnsembleDirection {
  /** true tant que l'API d'agrégation n'est pas branchée. */
  demonstration: boolean;
  miseAJour: string;
  departements: string[];
  indicateurs: IndicateurCle[];
  charges: ChargePersonne[];
  projets: ProjetPortefeuille[];
  alertes: AlerteDirection[];
  repartition: RepartitionTemps[];
}
