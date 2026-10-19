import {User} from '../../../../type/issue';
import {userDisplayName} from '../../../../type/issue-grouping.util';
import {JourPresence} from './gantt-absences';
import {FenetreGantt, Segment} from './gantt-fenetre';

/*
 * Rangée « Sans planning » de l'en-tête du Gantt : les jours de
 * `presencesParJour` rangés case par case de l'axe. À l'échelle du jour, une
 * case est un jour ; à la semaine ou au mois, elle cumule ses jours ouvrables.
 * Fonction pure.
 */

/** Une personne et son nombre de jours dans la case. */
export interface PersonneCase {
  personne: User;
  nom: string;
  jours: number;
}

export interface CasePresence extends Segment {
  titre: string;
  /** Jours ouvrables comptés dans la case. */
  jours: number;
  membres: number;
  /** Membres sans planning au moins un jour de la case, du plus absent au moins absent. */
  absents: PersonneCase[];
  /** Membres sans aucun jour d'absence dans la case. */
  presents: PersonneCase[];
  /** Jours-personne sans planning : le nombre de la case ; au jour près, des personnes. */
  joursAbsence: number;
}

export function presencesParCase(jours: JourPresence[], fenetre: FenetreGantt): CasePresence[] {
  const cases = new Map<number, JourPresence[]>();
  for (const jour of jours) {
    if (fenetre.contient(jour.jour)) {
      const seau = fenetre.seau(jour.jour);
      cases.set(seau, [...(cases.get(seau) ?? []), jour]);
    }
  }
  const resultat: CasePresence[] = [];
  [...cases.keys()].sort((a, b) => a - b).forEach(seau => {
    const segment = fenetre.segmentDeCase(seau);
    if (segment) {
      resultat.push({...segment, ...resumer(cases.get(seau)!, fenetre.libelleCase(seau))});
    }
  });
  return resultat;
}

function resumer(lot: JourPresence[], titre: string): Omit<CasePresence, keyof Segment> {
  const absences = new Map<string, PersonneCase>();
  for (const jour of lot) {
    for (const personne of jour.absents) {
      const deja = absences.get(personne.id);
      absences.set(personne.id, {personne, nom: userDisplayName(personne), jours: (deja?.jours ?? 0) + 1});
    }
  }
  const membres = lot[0]?.membres ?? [];
  const absents = [...absences.values()].sort((a, b) => b.jours - a.jours || a.nom.localeCompare(b.nom));
  const presents = membres
    .filter(m => !absences.has(m.id))
    .map(personne => ({personne, nom: userDisplayName(personne), jours: 0}))
    .sort((a, b) => a.nom.localeCompare(b.nom));
  return {
    titre,
    jours: lot.length,
    membres: membres.length,
    absents,
    presents,
    joursAbsence: absents.reduce((total, a) => total + a.jours, 0)
  };
}
