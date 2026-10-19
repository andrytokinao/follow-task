import {EventApp, User} from '../../../../type/issue';
import {userDisplayName} from '../../../../type/issue-grouping.util';
import {HEURE, instantDe, minuit, plusJours} from './gantt-dates.util';
import {FenetreGantt, Segment} from './gantt-fenetre';

/*
 * Effectif d'un projet, case par case de l'axe : combien de personnes ont une
 * séance de planning sur ses tâches ce jour-là (cette semaine, ce mois). Tiré
 * des mêmes événements que l'activité ; fonction pure.
 */

const TYPE_EVENEMENT_CHAMP = 'CUSTOM_FIELD';

/** Une case de la ligne d'un projet. */
export interface CaseEffectif extends Segment {
  nombre: number;
  titre: string;
  detail: string;
}

/**
 * Cases non vides de chaque projet, par identifiant de projet.
 *
 * @param projetDe projet d'une tâche ; un événement dont la tâche n'en a pas est ignoré
 */
export function effectifsParProjet(evenements: EventApp[], fenetre: FenetreGantt,
                                   projetDe: (tacheId: number) => number | undefined): Map<number, CaseEffectif[]> {
  // projet -> case -> personnes
  const comptes = new Map<number, Map<number, Map<string, User>>>();
  for (const evenement of evenements) {
    const projet = evenement.issue?.id == null ? undefined : projetDe(evenement.issue.id);
    const personne = evenement.user;
    const jours = joursDe(evenement, fenetre);
    if (projet === undefined || !personne?.id || !jours.length) {
      continue;
    }
    const cases = comptes.get(projet) ?? new Map<number, Map<string, User>>();
    for (const jour of jours) {
      const seau = fenetre.seau(jour);
      const personnes = cases.get(seau) ?? new Map<string, User>();
      personnes.set(personne.id, personne);
      cases.set(seau, personnes);
    }
    comptes.set(projet, cases);
  }

  const resultat = new Map<number, CaseEffectif[]>();
  comptes.forEach((cases, projet) => {
    const lignes: CaseEffectif[] = [];
    [...cases.keys()].sort((a, b) => a - b).forEach(seau => {
      const segment = fenetre.segmentDeCase(seau);
      const personnes = [...cases.get(seau)!.values()];
      if (segment) {
        lignes.push({
          ...segment,
          nombre: personnes.length,
          titre: fenetre.libelleCase(seau),
          detail: `${personnes.length} personne(s) au travail sur le projet : `
            + personnes.map(userDisplayName).sort().join(', ')
        });
      }
    });
    resultat.set(projet, lignes);
  });
  return resultat;
}

/** Jours couverts par une séance, dans la fenêtre ; aucun pour une date de champ ou une séance reportée. */
function joursDe(evenement: EventApp, fenetre: FenetreGantt): number[] {
  const debut = instantDe(evenement.start);
  if (debut === null || evenement.eventType?.name?.toUpperCase() === TYPE_EVENEMENT_CHAMP
    || evenement.executionStatus === 'POSTPONED') {
    return [];
  }
  const fin = Math.max(instantDe(evenement.end) ?? debut + HEURE, debut + 1);
  const jours: number[] = [];
  const dernier = minuit(Math.min(fin, fenetre.fin) - 1);
  for (let jour = minuit(Math.max(debut, fenetre.debut)); jour <= dernier; jour = plusJours(jour, 1)) {
    jours.push(jour);
  }
  return jours;
}
