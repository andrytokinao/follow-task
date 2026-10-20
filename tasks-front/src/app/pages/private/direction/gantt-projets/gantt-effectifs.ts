import {User} from '../../../../type/issue';
import {userDisplayName} from '../../../../type/issue-grouping.util';
import {PlageTache} from '../direction.model';
import {instantDe, JOUR, minuit, plusJours} from './gantt-dates.util';
import {FenetreGantt, Segment} from './gantt-fenetre';

/*
 * Effectif d'un projet, case par case de l'axe : combien de personnes ont une
 * séance de planning sur ses tâches ce jour-là (cette semaine, ce mois).
 *
 * Calculé sur `plagesProjets` (règle des rappels : une séance sans fin ou à
 * cheval sur la période compte), et non sur les séances de l'activité, que la
 * recherche d'événements filtre trop. Fonction pure.
 */

/** Une personne au travail sur le projet, et ses jours de séance. */
export interface PersonneEffectif {
  id: string;
  nom: string;
  /** null quand la page ne la connaît pas : l'avatar montre alors ses initiales. */
  personne: User | null;
  jours: number;
}

/** Une case de la ligne d'un projet. */
export interface CaseEffectif extends Segment {
  nombre: number;
  titre: string;
  detail: string;
  /** Jours de la case (1, 7, ou ceux du mois) : « 3 j / 7 ». */
  jours: number;
  /** Les personnes, par nom : la liste du menu de la case. */
  personnes: PersonneEffectif[];
}

export interface EffectifsGantt {
  /** Cases non vides de chaque projet, par identifiant de projet. */
  parCase: Map<number, CaseEffectif[]>;
  /** Personnes distinctes sur toute la fenêtre, par projet. */
  totaux: Map<number, number>;
  /** Ces mêmes personnes, par nom : la liste du menu du total. */
  equipes: Map<number, PersonneEffectif[]>;
}

/** Une personne d'après son identifiant. */
export type Annuaire = (userId: string) => { nom: string; personne: User | null };

/** Jours de séance de chaque personne : identifiant -> jours. */
type JoursParPersonne = Map<string, Set<number>>;

/**
 * @param projetDe  projet d'une tâche ; une plage dont la tâche n'en a pas est ignorée
 * @param personnes identifiants retenus par le filtre ; vide : tout le monde
 * @param qui       nom et fiche d'une personne d'après son identifiant
 */
export function effectifsParProjet(plages: PlageTache[], fenetre: FenetreGantt,
                                   projetDe: (tacheId: number) => number | undefined,
                                   personnes: string[],
                                   qui: Annuaire): EffectifsGantt {
  const retenus = new Set(personnes);
  // projet -> case -> personne -> jours
  const comptes = new Map<number, Map<number, JoursParPersonne>>();
  const totaux = new Map<number, JoursParPersonne>();
  for (const plage of plages) {
    const projet = projetDe(plage.issueId);
    if (projet === undefined || !plage.userId || (retenus.size && !retenus.has(plage.userId))) {
      continue;
    }
    const cases = comptes.get(projet) ?? new Map<number, JoursParPersonne>();
    const total = totaux.get(projet) ?? new Map<string, Set<number>>();
    for (const jour of joursDe(plage, fenetre)) {
      const seau = fenetre.seau(jour);
      const parPersonne = cases.get(seau) ?? new Map<string, Set<number>>();
      ajouterJour(parPersonne, plage.userId, jour);
      ajouterJour(total, plage.userId, jour);
      cases.set(seau, parPersonne);
    }
    comptes.set(projet, cases);
    if (total.size) {
      totaux.set(projet, total);
    }
  }

  const liste = (parPersonne: JoursParPersonne): PersonneEffectif[] => [...parPersonne]
    .map(([id, jours]) => ({id, ...qui(id), jours: jours.size}))
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const parCase = new Map<number, CaseEffectif[]>();
  comptes.forEach((cases, projet) => {
    const lignes: CaseEffectif[] = [];
    [...cases.keys()].sort((a, b) => a - b).forEach(seau => {
      const segment = fenetre.segmentDeCase(seau);
      const equipe = liste(cases.get(seau)!);
      if (segment) {
        lignes.push({
          ...segment,
          nombre: equipe.length,
          titre: fenetre.libelleCase(seau),
          detail: `${equipe.length} personne(s) au travail sur le projet : ` + equipe.map(p => p.nom).join(', '),
          jours: Math.round((fenetre.finDeCase(seau) - seau) / JOUR),
          personnes: equipe
        });
      }
    });
    parCase.set(projet, lignes);
  });
  const equipes = new Map([...totaux].map(([projet, parPersonne]) => [projet, liste(parPersonne)]));
  return {parCase, totaux: new Map([...equipes].map(([projet, equipe]) => [projet, equipe.length])), equipes};
}

function ajouterJour(parPersonne: JoursParPersonne, userId: string, jour: number): void {
  parPersonne.set(userId, (parPersonne.get(userId) ?? new Set<number>()).add(jour));
}

/** Nom et fiche d'une personne parmi celles connues de la page ; à défaut, son identifiant. */
export function annuaire(connus: User[]): Annuaire {
  const fiches = new Map(connus.filter(u => !!u?.id).map(u => [u.id, u]));
  return userId => {
    const personne = fiches.get(userId) ?? null;
    return {nom: personne ? userDisplayName(personne) : userId, personne};
  };
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
