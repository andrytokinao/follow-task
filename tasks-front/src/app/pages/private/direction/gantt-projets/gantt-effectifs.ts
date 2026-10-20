import {User} from '../../../../type/issue';
import {userDisplayName} from '../../../../type/issue-grouping.util';
import {PlageTache} from '../direction.model';
import {instantDe, minuit, plusJours} from './gantt-dates.util';
import {FenetreGantt, Segment} from './gantt-fenetre';

/*
 * Effectif d'un projet, case par case de l'axe : combien de personnes ont une
 * séance de planning sur ses tâches ce jour-là (cette semaine, ce mois).
 *
 * Calculé sur `plagesProjets` (règle des rappels : une séance sans fin ou à
 * cheval sur la période compte), et non sur les séances de l'activité, que la
 * recherche d'événements filtre trop. Fonction pure.
 */

/** Une case de la ligne d'un projet. */
export interface CaseEffectif extends Segment {
  nombre: number;
  titre: string;
  detail: string;
}

export interface EffectifsGantt {
  /** Cases non vides de chaque projet, par identifiant de projet. */
  parCase: Map<number, CaseEffectif[]>;
  /** Personnes distinctes sur toute la fenêtre, par projet. */
  totaux: Map<number, number>;
}

/**
 * @param projetDe  projet d'une tâche ; une plage dont la tâche n'en a pas est ignorée
 * @param personnes identifiants retenus par le filtre ; vide : tout le monde
 * @param nomDe     nom d'une personne d'après son identifiant
 */
export function effectifsParProjet(plages: PlageTache[], fenetre: FenetreGantt,
                                   projetDe: (tacheId: number) => number | undefined,
                                   personnes: string[],
                                   nomDe: (userId: string) => string): EffectifsGantt {
  const retenus = new Set(personnes);
  // projet -> case -> identifiants
  const comptes = new Map<number, Map<number, Set<string>>>();
  const totaux = new Map<number, Set<string>>();
  for (const plage of plages) {
    const projet = projetDe(plage.issueId);
    if (projet === undefined || !plage.userId || (retenus.size && !retenus.has(plage.userId))) {
      continue;
    }
    const cases = comptes.get(projet) ?? new Map<number, Set<string>>();
    for (const jour of joursDe(plage, fenetre)) {
      const seau = fenetre.seau(jour);
      cases.set(seau, (cases.get(seau) ?? new Set<string>()).add(plage.userId));
      totaux.set(projet, (totaux.get(projet) ?? new Set<string>()).add(plage.userId));
    }
    comptes.set(projet, cases);
  }

  const parCase = new Map<number, CaseEffectif[]>();
  comptes.forEach((cases, projet) => {
    const lignes: CaseEffectif[] = [];
    [...cases.keys()].sort((a, b) => a - b).forEach(seau => {
      const segment = fenetre.segmentDeCase(seau);
      const ids = [...cases.get(seau)!];
      if (segment) {
        lignes.push({
          ...segment,
          nombre: ids.length,
          titre: fenetre.libelleCase(seau),
          detail: `${ids.length} personne(s) au travail sur le projet : ` + ids.map(nomDe).sort().join(', ')
        });
      }
    });
    parCase.set(projet, lignes);
  });
  return {parCase, totaux: new Map([...totaux].map(([projet, ids]) => [projet, ids.size]))};
}

/** Nom d'une personne parmi celles connues de la page ; à défaut, son identifiant. */
export function nommeur(connus: User[]): (userId: string) => string {
  const noms = new Map(connus.filter(u => !!u?.id).map(u => [u.id, userDisplayName(u)]));
  return userId => noms.get(userId) ?? userId;
}

/** Jours couverts par une plage dans la fenêtre ; fin exclue. */
function joursDe(plage: PlageTache, fenetre: FenetreGantt): number[] {
  const debut = instantDe(plage.debut);
  const fin = instantDe(plage.fin);
  if (debut === null || fin === null || fin <= debut) {
    return [];
  }
  const jours: number[] = [];
  const dernier = Math.min(fin, fenetre.fin);
  for (let jour = minuit(Math.max(debut, fenetre.debut)); jour < dernier; jour = plusJours(jour, 1)) {
    jours.push(jour);
  }
  return jours;
}
