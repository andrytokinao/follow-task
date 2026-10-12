import {EventApp, Issue, User} from '../../../../type/issue';
import {issueAssignees} from '../../../../type/issue-grouping.util';

/*
 * Personnes du Gantt de direction : les assignés d'une tâche, et ceux qui y ont
 * des séances de planning sans y être assignés. Sans ces derniers, le filtre
 * des personnes (`app-assignee-filter`, qui ne lit que les assignés) ne
 * proposerait pas quelqu'un dont le travail est pourtant dessiné.
 */

/**
 * Mémoire des intervenants par tâche. Elle ne fait que grandir : une recherche
 * restreinte à une personne ne doit pas faire disparaître les autres du filtre.
 */
export class IntervenantsGantt {

  private readonly parTache = new Map<number, Map<string, User>>();

  retenir(evenements: EventApp[]): void {
    for (const evenement of evenements) {
      const tacheId = evenement.issue?.id;
      const personne = evenement.user;
      if (tacheId == null || !personne?.id) {
        continue;
      }
      const connus = this.parTache.get(tacheId) ?? new Map<string, User>();
      connus.set(personne.id, personne);
      this.parTache.set(tacheId, connus);
    }
  }

  /**
   * Les tâches telles que le filtre des personnes doit les voir : chacune
   * avec ses assignés et ses intervenants. Copies — les tâches d'origine, que
   * le diagramme dessine, ne sont pas touchées.
   */
  completer(taches: Issue[]): Issue[] {
    return taches.map(tache => {
      const personnes = new Map<string, User>();
      issueAssignees(tache).forEach(personne => personnes.set(personne.id, personne));
      this.parTache.get(tache.id as number)?.forEach(personne => personnes.set(personne.id, personne));
      return {...tache, activeMemberships: [...personnes.values()].map(user => ({user}))};
    });
  }
}
