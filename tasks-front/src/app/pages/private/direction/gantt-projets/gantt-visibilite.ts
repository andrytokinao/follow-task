import {issueAssignees, UNASSIGNED_ID} from '../../../../type/issue-grouping.util';
import {ActivitesGantt} from './gantt-evenements';
import {BlocGantt, LigneGantt} from './gantt-projets.model';

/*
 * Personnes choisies sur le Gantt : seules restent les tâches qui les
 * concernent, et les projets qui en ont encore une. Fonctions pures.
 */

export interface VisibiliteGantt {
  /** Clés des lignes masquées. */
  lignes: Set<string>;
  /** Projets dont aucune ligne ne reste. */
  projets: Set<number>;
}

export const TOUT_VISIBLE: VisibiliteGantt = {lignes: new Set(), projets: new Set()};

/**
 * Une ligne concerne les personnes choisies si l'une y est assignée ou y a une
 * séance sur la période ; « Non assigné » garde les tâches sans assigné.
 * Sans personne choisie, tout est visible.
 */
export function visibilite(blocs: BlocGantt[], selection: string[], activites: ActivitesGantt): VisibiliteGantt {
  if (!selection.length) {
    return TOUT_VISIBLE;
  }
  const choisis = new Set(selection);
  const concerne = (l: LigneGantt) =>
    activites.de(l.cle).personnes.some(p => choisis.has(p.id))
    || l.taches.some(tache => {
      const assignes = issueAssignees(tache);
      return assignes.some(p => choisis.has(p.id)) || (!assignes.length && choisis.has(UNASSIGNED_ID));
    });
  const lignes = new Set<string>();
  const projets = new Set<number>();
  for (const bloc of blocs) {
    const masquees = bloc.lignes.filter(l => !concerne(l));
    masquees.forEach(l => lignes.add(l.cle));
    if (masquees.length === bloc.lignes.length) {
      projets.add(bloc.projet.id as number);
    }
  }
  return {lignes, projets};
}
