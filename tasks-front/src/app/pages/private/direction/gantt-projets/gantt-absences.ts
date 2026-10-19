import {EventApp, User} from '../../../../type/issue';
import {estWeekend, HEURE, instantDe, minuit, plusJours} from './gantt-dates.util';

/*
 * Absences du Gantt de direction, calculées dans le navigateur : pour chaque
 * jour ouvrable, quels membres de l'espace n'ont aucune séance de planning.
 *
 * Les membres sont chargés d'abord, puis toutes leurs séances sur la période,
 * tous projets confondus : on est présent dès qu'on a renseigné une activité,
 * où que ce soit. Ainsi absents + présents = membres, chaque jour.
 *
 * Fonction pure.
 */

const TYPE_EVENEMENT_CHAMP = 'CUSTOM_FIELD';

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
 * @param membres    tous les membres de l'espace, chargés avant les séances
 * @param evenements séances de ces membres sur la période
 */
export function presencesParJour(membres: User[], evenements: EventApp[], debut: number, fin: number,
                                 maintenant: number): JourPresence[] {
  const actifsParJour = joursDActivite(evenements);
  const dernier = Math.min(fin, plusJours(minuit(maintenant), 1));
  const jours: JourPresence[] = [];
  for (let jour = minuit(debut); jour < dernier; jour = plusJours(jour, 1)) {
    if (estWeekend(jour)) {
      continue;
    }
    const actifs = actifsParJour.get(jour) ?? new Set<string>();
    jours.push({
      jour,
      membres,
      absents: membres.filter(m => !actifs.has(m.id)),
      presents: membres.filter(m => actifs.has(m.id))
    });
  }
  return jours;
}

/** Pour chaque jour, les identifiants des personnes qui y ont une séance. */
function joursDActivite(evenements: EventApp[]): Map<number, Set<string>> {
  const parJour = new Map<number, Set<string>>();
  for (const evenement of evenements) {
    const id = evenement.user?.id;
    const debut = instantDe(evenement.start);
    if (!id || debut === null || evenement.executionStatus === 'POSTPONED'
      || evenement.eventType?.name?.toUpperCase() === TYPE_EVENEMENT_CHAMP) {
      continue;
    }
    const fin = Math.max(instantDe(evenement.end) ?? debut + HEURE, debut + 1);
    for (let jour = minuit(debut); jour < fin; jour = plusJours(jour, 1)) {
      const actifs = parJour.get(jour) ?? new Set<string>();
      actifs.add(id);
      parJour.set(jour, actifs);
    }
  }
  return parJour;
}
