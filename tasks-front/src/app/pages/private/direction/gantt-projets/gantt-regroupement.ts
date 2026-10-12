import {TacheGantt} from '../direction.model';

/*
 * Regroupements du Gantt de direction : ce que liste la colonne de gauche sous
 * chaque projet. Un regroupement dit seulement à quel groupe appartient une
 * tâche ; la structure en fait une ligne par groupe, et les événements de
 * planning suivent leur tâche jusqu'à cette ligne.
 *
 * Ajouter un regroupement, c'est ajouter une entrée à `REGROUPEMENTS` : rien
 * d'autre ne change.
 */

export interface GroupeGantt {
  /** Identifiant du groupe dans son projet. */
  cle: string;
  nom: string;
}

export interface Regroupement {
  id: string;
  libelle: string;
  /** false : annoncé, pas encore proposé au choix. */
  disponible: boolean;
  /**
   * Une ligne par tâche : la ligne est la tâche elle-même (avatar, lien,
   * statut), pas un groupe à résumer.
   */
  parTache: boolean;
  groupeDe(tache: TacheGantt): GroupeGantt;
}

const SANS_TYPE: GroupeGantt = {cle: 'type:aucun', nom: 'Sans type'};

export const PAR_TACHE: Regroupement = {
  id: 'tache',
  libelle: 'Tâche',
  disponible: true,
  parTache: true,
  groupeDe: tache => ({cle: `tache:${tache.id}`, nom: String(tache.summary ?? '')})
};

export const PAR_TYPE: Regroupement = {
  id: 'type',
  libelle: 'Type de tâche',
  disponible: true,
  parTache: false,
  groupeDe: tache => tache.issueType?.id != null
    ? {cle: `type:${tache.issueType.id}`, nom: String(tache.issueType.name ?? '')}
    : SANS_TYPE
};

/**
 * Phase : un groupe de types de tâche. Les phases n'existent pas encore dans
 * l'application ; le jour où un type porte sa phase, `groupeDe` la lira et
 * `disponible` passera à true.
 */
export const PAR_PHASE: Regroupement = {
  id: 'phase',
  libelle: 'Phase',
  disponible: false,
  parTache: false,
  groupeDe: PAR_TYPE.groupeDe
};

/** Du plus large au plus fin, dans l'ordre du menu. */
export const REGROUPEMENTS: Regroupement[] = [PAR_PHASE, PAR_TYPE, PAR_TACHE];
