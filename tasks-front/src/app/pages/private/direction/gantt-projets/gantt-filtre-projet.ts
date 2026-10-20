import {IssueType} from '../../../../type/issue';
import {BlocGantt, LigneGantt} from './gantt-projets.model';

/*
 * Filtre propre à chaque projet du Gantt : les types de tâche affichés, et
 * l'ordre des lignes (exécution, ou par type). Fonctions pures.
 */

export type OrdreLignes = 'execution' | 'type';

export interface FiltreProjet {
  /** Types de tâche décochés : leurs lignes sont masquées. */
  typesMasques: Set<number>;
  ordre: OrdreLignes;
}

/** Un type de tâche d'un projet, proposé au menu du filtre. */
export interface TypeProjet {
  id: number;
  type: IssueType;
  nom: string;
  /** Tâches du projet de ce type. */
  nombre: number;
}

export const SANS_FILTRE: FiltreProjet = {typesMasques: new Set(), ordre: 'execution'};

/** Sans type, une tâche se range à part, et ne se masque pas. */
const SANS_TYPE = -1;

export function typeDe(ligne: LigneGantt): number {
  return (ligne.taches[0]?.issueType?.id as number) ?? SANS_TYPE;
}

/** Types des tâches du projet, par nom, chacun avec son nombre de tâches. */
export function typesDuProjet(bloc: BlocGantt): TypeProjet[] {
  const types = new Map<number, TypeProjet>();
  for (const tache of bloc.projet.children ?? []) {
    const type = tache.issueType as IssueType | undefined;
    if (type?.id == null) {
      continue;
    }
    const connu = types.get(type.id);
    types.set(type.id, connu
      ? {...connu, nombre: connu.nombre + 1}
      : {id: type.id, type, nom: String(type.name ?? ''), nombre: 1});
  }
  return [...types.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

/** Une ligne est masquée si toutes ses tâches sont d'un type décoché. */
export function masqueeParType(ligne: LigneGantt, filtre: FiltreProjet): boolean {
  return !!filtre.typesMasques.size && ligne.taches.length > 0
    && ligne.taches.every(t => filtre.typesMasques.has(t.issueType?.id as number));
}

/**
 * Les lignes dans l'ordre choisi. Par type : les types par nom, et dans un
 * type, l'ordre d'exécution (`execution`, l'ordre rendu par le constructeur).
 */
export function ordonner(lignes: LigneGantt[], ordre: OrdreLignes, execution: (a: LigneGantt, b: LigneGantt) => number,
                         types: TypeProjet[]): LigneGantt[] {
  if (ordre === 'execution') {
    return [...lignes].sort(execution);
  }
  const rang = new Map(types.map((t, i) => [t.id, i]));
  const rangDe = (l: LigneGantt) => rang.get(typeDe(l)) ?? types.length;
  return [...lignes].sort((a, b) => rangDe(a) - rangDe(b) || execution(a, b));
}
