import {IssueType, Phase, Status} from "./issue";

/*
 * Calculs sur les phases de projet, sans état : affichage des phases d'un
 * type, ordre des phases, statuts disponibles pour le lien phase / statut.
 */

/** « APS · APD » ; vide si le type n'est rangé dans aucune phase. */
export function nomsDesPhases(type: IssueType | null | undefined): string {
  return (type?.phases || []).map(phase => phase.name).join(' · ');
}

/** Mêmes ids, quel que soit l'ordre. */
export function memesIds(a: (number | undefined)[], b: (number | undefined)[]): boolean {
  const ensemble = new Set(a);
  return a.length === b.length && b.every(id => ensemble.has(id));
}

/** Copie de la liste où l'élément d'indice `index` a pris la place de son voisin. */
export function deplacer<T>(liste: T[], index: number, sens: -1 | 1): T[] {
  const cible = index + sens;
  if (index < 0 || index >= liste.length || cible < 0 || cible >= liste.length) {
    return liste;
  }
  const copie = [...liste];
  [copie[index], copie[cible]] = [copie[cible], copie[index]];
  return copie;
}

/**
 * Statuts de la phase pris parmi ceux des projets de l'espace. Une phase
 * commune porte aussi les statuts des flux des autres espaces : ils ne
 * concernent pas l'écran en cours.
 */
export function statutsDansEspace(phase: Phase, statutsEspace: Status[]): Status[] {
  const ids = new Set(statutsEspace.map(status => status.id));
  return (phase.statuses || []).filter(status => ids.has(status.id));
}

/** Statuts de l'espace qui ne désignent encore aucune phase : un statut ne désigne qu'une phase. */
export function statutsLibres(phases: Phase[], statutsEspace: Status[]): Status[] {
  const pris = new Set<number>();
  phases.forEach(phase => (phase.statuses || []).forEach(status => pris.add(status.id)));
  return statutsEspace.filter(status => !pris.has(status.id));
}

/** Types rangés dans la phase ; un sous-type partagé entre plusieurs parents n'est compté qu'une fois. */
export function nombreDeTypes(phase: Phase, typesPrincipaux: IssueType[]): number {
  const ids = new Set<number | undefined>();
  typesPrincipaux.forEach(parent => {
    [parent, ...(parent.children || [])]
      .filter(type => (type.phases || []).some(p => p.id == phase.id))
      .forEach(type => ids.add(type.id));
  });
  return ids.size;
}
