import {User} from '../../../../type/issue';
import {PlageMembre} from '../direction.model';
import {estWeekend, instantDe, minuit, plusJours} from './gantt-dates.util';

/*
 * Absences du Gantt de direction, calculées dans le navigateur : pour chaque
 * jour ouvrable, quels membres de l'espace n'ont aucune séance de planning.
 *
 * Les membres sont chargés d'abord, puis le temps occupé par toutes leurs
 * séances sur la période, tous projets confondus (`plagesMembres`, règle des
 * rappels : une séance sans fin ou à cheval sur la période compte). On est
 * présent dès qu'on a renseigné une activité ce jour-là, où que ce soit.
 * Ainsi absents + présents = membres, chaque jour.
 *
 * Fonction pure.
 */

/** Un jour ouvrable passé, ou aujourd'hui : chaque membre est présent ou absent. */
export interface JourPresence {
  /** Minuit du jour. */
  jour: number;
  membres: User[];
  /** Aucune séance ce jour-là. */
  absents: User[];
  /** Au moins une séance ce jour-là, sur n'importe quel projet. */
  presents: User[];
}

/**
 * Jours ouvrables (lundi-vendredi) de `debut` à `fin` exclue, jusqu'à
 * aujourd'hui compris : un jour à venir n'a pas encore d'absent.
 *
 * @param membres tous les membres de l'espace, chargés avant les plages
 * @param plages  temps occupé par leurs séances sur la période
 */
export function presencesParJour(membres: User[], plages: PlageMembre[], debut: number, fin: number,
                                 maintenant: number): JourPresence[] {
  // Les membres viennent groupe par groupe : une personne de deux groupes compterait deux fois.
  const uniques = [...new Map(membres.filter(m => !!m?.id).map(m => [m.id, m])).values()];
  const actifsParJour = joursDActivite(plages);
  const dernier = Math.min(fin, plusJours(minuit(maintenant), 1));
  const jours: JourPresence[] = [];
  for (let jour = minuit(debut); jour < dernier; jour = plusJours(jour, 1)) {
    if (estWeekend(jour)) {
      continue;
    }
    const actifs = actifsParJour.get(jour) ?? new Set<string>();
    jours.push({
      jour,
      membres: uniques,
      absents: uniques.filter(m => !actifs.has(m.id)),
      presents: uniques.filter(m => actifs.has(m.id))
    });
  }
  return jours;
}

/** Pour chaque jour, les identifiants des personnes qui y ont une séance. */
function joursDActivite(plages: PlageMembre[]): Map<number, Set<string>> {
  const parJour = new Map<number, Set<string>>();
  for (const plage of plages) {
    const debut = instantDe(plage.debut);
    const fin = instantDe(plage.fin);
    if (!plage.userId || debut === null || fin === null || fin <= debut) {
      continue;
    }
    // Fin exclue : une séance qui finit à minuit n'occupe pas le lendemain.
    for (let jour = minuit(debut); jour < fin; jour = plusJours(jour, 1)) {
      const actifs = parJour.get(jour) ?? new Set<string>();
      actifs.add(plage.userId);
      parJour.set(jour, actifs);
    }
  }
  return parJour;
}
