import {ChoixTypeSousTache, Phase} from "./issue";

/*
 * Création d'une sous-tâche : types proposés selon la phase courante du
 * projet, groupés par phase. Voir docs/technique/DT-001-phases-projet.html.
 */

/** Un groupe du menu des types : une phase, ou les types sans phase. */
export interface GroupeChoix {
  cle: string;
  titre: string;
  /** Phase en cours du projet. */
  courante: boolean;
  choix: ChoixTypeSousTache[];
}

/**
 * Groupes du menu des types, dans l'ordre reçu du serveur (ordre des phases,
 * puis types sans phase). Sans `afficherTout`, seules les entrées proposées
 * d'office : celles de la phase courante et les types sans phase.
 */
export function grouperChoix(choix: ChoixTypeSousTache[], phaseCourante: Phase | null | undefined,
                             afficherTout: boolean): GroupeChoix[] {
  const groupes: GroupeChoix[] = [];
  choix
    .filter(entree => afficherTout || entree.proposee)
    .forEach(entree => {
      const cle = entree.phase?.id != null ? 'phase:' + entree.phase.id : 'phase:aucune';
      let groupe = groupes.find(g => g.cle === cle);
      if (!groupe) {
        groupe = {
          cle,
          titre: entree.phase?.name || 'Sans phase',
          courante: entree.phase?.id != null && entree.phase.id === phaseCourante?.id,
          choix: []
        };
        groupes.push(groupe);
      }
      groupe.choix.push(entree);
    });
  return groupes;
}

/**
 * Légende d'un type dans le menu : la phase où la tâche sera classée
 * (« Phase APS »), « Toutes phases » si le type n'est rangé dans aucune.
 */
export function legendeType(choix: ChoixTypeSousTache): string {
  return choix.phase?.name ? 'Phase ' + choix.phase.name : 'Toutes phases';
}

/** Entrées cachées tant que les autres phases ne sont pas affichées. */
export function nombreDeChoixMasques(choix: ChoixTypeSousTache[]): number {
  return choix.filter(entree => !entree.proposee).length;
}

/**
 * Entrée retenue d'office : celle du type demandé s'il y en a une (proposée
 * de préférence), sinon la première proposée.
 */
export function choixParDefaut(choix: ChoixTypeSousTache[], issueTypeId?: number): ChoixTypeSousTache | undefined {
  const duType = issueTypeId == null ? [] : choix.filter(entree => entree.issueType.id === issueTypeId);
  return duType.find(entree => entree.proposee) ?? duType[0] ?? choix.find(entree => entree.proposee) ?? choix[0];
}

/** La tâche sera classée hors de la phase en cours du projet (correction, avance). */
export function estHorsPhaseCourante(phase: Phase | null | undefined, phaseCourante: Phase | null | undefined): boolean {
  return phase?.id != null && phaseCourante?.id != null && phase.id !== phaseCourante.id;
}
