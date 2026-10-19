import {userDisplayName} from '../../../../type/issue-grouping.util';
import {PresenceJour, PresencePersonne} from '../direction.model';
import {jourDe} from './gantt-dates.util';
import {FenetreGantt, Segment} from './gantt-fenetre';

/*
 * Rangée « Sans planning » de l'en-tête du Gantt : les ouvriers qui n'ont rien
 * renseigné (absents) ou pas tout (incomplets), case par case de l'axe.
 * À l'échelle du jour, ce sont des personnes ; à la semaine ou au mois, des
 * jours-personne. Fonction pure.
 */

export interface CasePresence extends Segment {
  /** Personnes (au jour) ou jours-personne (semaine, mois) sans aucune activité. */
  absents: number;
  incomplets: number;
  titre: string;
  detail: string;
}

export function presencesParCase(jours: PresenceJour[], fenetre: FenetreGantt): CasePresence[] {
  const cases = new Map<number, PresenceJour[]>();
  for (const jour of jours) {
    const date = jourDe(jour.jour);
    if (date !== null && fenetre.contient(date)) {
      const seau = fenetre.seau(date);
      cases.set(seau, [...(cases.get(seau) ?? []), jour]);
    }
  }
  const resultat: CasePresence[] = [];
  [...cases.keys()].sort((a, b) => a - b).forEach(seau => {
    const segment = fenetre.segmentDeCase(seau);
    const lot = cases.get(seau)!;
    if (segment) {
      const absents = lot.flatMap(j => j.absents);
      const incomplets = lot.flatMap(j => j.incomplets);
      resultat.push({
        ...segment,
        absents: absents.length,
        incomplets: incomplets.length,
        titre: fenetre.libelleCase(seau),
        detail: detail(absents, incomplets, lot, fenetre.echelle === 'jour')
      });
    }
  });
  return resultat;
}

function detail(absents: PresencePersonne[], incomplets: PresencePersonne[], lot: PresenceJour[], parJour: boolean): string {
  const ouvriers = Math.max(...lot.map(j => j.ouvriers));
  const unite = parJour ? 'personne(s)' : 'jour(s)-personne';
  const parties: string[] = [];
  parties.push(absents.length
    ? `${absents.length} ${unite} sans aucune activité : ${noms(absents)}`
    : 'Personne sans aucune activité');
  if (incomplets.length) {
    parties.push(`${incomplets.length} ${unite} au planning incomplet : ${noms(incomplets)}`);
  }
  parties.push(parJour ? `sur ${ouvriers} ouvrier(s)` : `${ouvriers} ouvrier(s) sur ${lot.length} jour(s) ouvrable(s)`);
  return parties.join(' · ');
}

/** « Rakoto, Rabe ×3 » : une personne citée une fois, avec son nombre de jours. */
function noms(personnes: PresencePersonne[]): string {
  const comptes = new Map<string, number>();
  for (const p of personnes) {
    const nom = userDisplayName(p.personne);
    comptes.set(nom, (comptes.get(nom) ?? 0) + 1);
  }
  return [...comptes.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([nom, n]) => n > 1 ? `${nom} ×${n}` : nom)
    .join(', ');
}
