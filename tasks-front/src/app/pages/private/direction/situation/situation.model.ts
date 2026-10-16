import {User} from '../../../../type/issue';

/**
 * Situation du jour de la direction (DT-005) : reçue telle quelle de
 * `situationDirection` (schéma `situation-direction.graphqls`).
 */

/** Dans l'ordre d'affichage du serveur : ce qui demande l'attention d'abord. */
export type EtatPersonne =
  'NON_RENSEIGNE' | 'BLOQUE' | 'TROU_EN_COURS' | 'PAUSE_COURTE' | 'EN_ACTIVITE' | 'HORS_HORAIRES';

export type NiveauFiabilite = 'FIABLE' | 'PARTIELLE' | 'NON_FIABLE';

export interface Fiabilite {
  ouvriers: number;
  /** Ouvriers dont le planning dit ce qu'ils font maintenant. */
  planningAJour: number;
  /** Faux à midi, le soir et le week-end : la part se lit alors sur le remplissage. */
  enHoraires: boolean;
  remplissageJour: number | null;
  remplissageVeille: number | null;
  /** null : rien à mesurer (aucun ouvrier, aucune journée). */
  part: number | null;
  niveau: NiveauFiabilite | null;
}

export interface ChiffresProjets {
  enCours: number;
  avancementMoyen: number;
  tachesEnRetard: number;
  tachesBloquees: number;
}

export interface ProjetATraiter {
  id: number;
  cle: string;
  titre: string;
  departement: string | null;
  prefixeDepartement: string | null;
  avancement: number;
  tachesEnRetard: number;
  tachesBloquees: number;
}

export interface ActiviteSituation {
  id: number;
  titre: string | null;
  debut: string;
  fin: string | null;
  etat: string | null;
  avancement: number | null;
  cleTache: string | null;
  tache: string | null;
  /** null si la tâche est elle-même le projet. */
  cleProjet: string | null;
  projet: string | null;
  prefixeDepartement: string | null;
}

export interface SituationPersonne {
  personne: User;
  departement: string | null;
  etat: EtatPersonne;
  activite: ActiviteSituation | null;
  rienDepuis: string | null;
  minutesAttendues: number;
  minutesCouvertes: number;
}

export interface SituationDirection {
  instant: string;
  fiabilite: Fiabilite;
  chiffres: ChiffresProjets;
  aTraiter: ProjetATraiter[];
  personnes: SituationPersonne[];
}

/** Ton visuel d'un état : réservé aux états, jamais décoratif. */
export type Ton = 'ok' | 'attention' | 'critique' | 'neutre';

/** Un état s'affiche toujours avec une icône et un mot, jamais la couleur seule. */
export interface Apparence {
  libelle: string;
  icone: string;
  ton: Ton;
}

export const ETATS: Record<EtatPersonne, Apparence> = {
  NON_RENSEIGNE: {libelle: 'Non renseigné', icone: 'far fa-circle', ton: 'critique'},
  BLOQUE: {libelle: 'Bloqué', icone: 'fas fa-hand-paper', ton: 'attention'},
  TROU_EN_COURS: {libelle: 'Trou en cours', icone: 'fas fa-adjust', ton: 'attention'},
  PAUSE_COURTE: {libelle: 'Pause courte', icone: 'fas fa-mug-hot', ton: 'neutre'},
  EN_ACTIVITE: {libelle: 'En activité', icone: 'fas fa-check', ton: 'ok'},
  HORS_HORAIRES: {libelle: 'Hors horaires', icone: 'far fa-moon', ton: 'neutre'}
};

/** États où l'on ne sait pas ce que fait la personne (`planningAJour` faux côté serveur). */
export const ETATS_SANS_PLANNING: ReadonlySet<EtatPersonne> = new Set<EtatPersonne>(['NON_RENSEIGNE', 'TROU_EN_COURS']);

export const NIVEAUX:Record<NiveauFiabilite, Apparence> = {
  FIABLE: {libelle: 'Fiable', icone: 'fas fa-check-circle', ton: 'ok'},
  PARTIELLE: {libelle: 'Partielle', icone: 'fas fa-exclamation-triangle', ton: 'attention'},
  NON_FIABLE: {libelle: 'Non fiable', icone: 'fas fa-times-circle', ton: 'critique'}
};

/** Lien vers une demande dans son espace de travail ; null sans espace connu. */
export function lienDemande(prefixe: string | null, cle: string | null): string[] | null {
  return prefixe && cle ? ['/working', prefixe, 'issue', cle] : null;
}

/** « 10:42 » à partir d'une date-heure ISO du serveur. */
export function heureDe(iso: string | null | undefined): string {
  const t = iso?.split('T')[1];
  return t ? t.substring(0, 5) : '';
}

/** 150 → « 2 h 30 », 120 → « 2 h », 40 → « 40 min ». */
export function duree(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) {
    return `${m} min`;
  }
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}
