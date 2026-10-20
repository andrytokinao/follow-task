import {issueAssignees, UNASSIGNED_ID} from '../../../../type/issue-grouping.util';
import {ActivitesGantt} from './gantt-evenements';
import {FiltreProjet, masqueeParType, SANS_FILTRE} from './gantt-filtre-projet';
import {BlocGantt, LigneGantt} from './gantt-projets.model';

/*
 * Ce que le Gantt masque : les tâches qui ne concernent pas les personnes
 * choisies, et les projets qui n'en ont plus ; les tâches des types décochés
 * dans le filtre d'un projet. Fonctions pures.
 */

export interface VisibiliteGantt {
  /** Clés des lignes masquées. */
  lignes: Set<string>;
  /** Projets dont aucune ligne ne concerne les personnes choisies. */
  projets: Set<number>;
}

export const TOUT_VISIBLE: VisibiliteGantt = {lignes: new Set(), projets: new Set()};

/**
 * Une ligne concerne les personnes choisies si l'une y est assignée ou y a une
 * séance sur la période ; « Non assigné » garde les tâches sans assigné. Un
 * projet ne se masque que par les personnes : décocher tous ses types laisse
 * son en-tête, et son filtre, en place.
 */
export function visibilite(blocs: BlocGantt[], selection: string[], activites: ActivitesGantt,
                           filtres: Map<number, FiltreProjet>): VisibiliteGantt {
  if (!selection.length && !filtres.size) {
    return TOUT_VISIBLE;
  }
  const choisis = new Set(selection);
  const concerne = (l: LigneGantt) => !choisis.size
    || activites.de(l.cle).personnes.some(p => choisis.has(p.id))
    || l.taches.some(tache => {
      const assignes = issueAssignees(tache);
      return assignes.some(p => choisis.has(p.id)) || (!assignes.length && choisis.has(UNASSIGNED_ID));
    });
  const lignes = new Set<string>();
  const projets = new Set<number>();
  for (const bloc of blocs) {
    const filtre = filtres.get(bloc.projet.id as number) ?? SANS_FILTRE;
    const horsSelection = bloc.lignes.filter(l => !concerne(l));
    horsSelection.forEach(l => lignes.add(l.cle));
    bloc.lignes.filter(l => masqueeParType(l, filtre)).forEach(l => lignes.add(l.cle));
    if (choisis.size && horsSelection.length === bloc.lignes.length) {
      projets.add(bloc.projet.id as number);
    }
  }
  return {lignes, projets};
}
