import {Issue, Status, User} from "./issue";

/*
 * Regroupements et filtres d'issues partagés par les vues liste et board.
 * Fonctions pures : les composants les appellent quand leurs entrées
 * changent, jamais depuis le gabarit, pour ne pas reparcourir les issues à
 * chaque cycle de détection de changements.
 */

/** Clé du filtre "non assigné" : aucun identifiant utilisateur ne la porte. */
export const UNASSIGNED_ID = '__unassigned__';

export interface AssigneeCount {
  user: User;
  count: number;
}

export function userDisplayName(user: User | null | undefined): string {
  if (user == null) {
    return '';
  }
  const name = ((user.firstName || '') + ' ' + (user.lastName || '')).trim();
  return name || (user.username || '');
}

/**
 * Assignés courants : issus des memberships actifs, avec repli sur l'ancien
 * champ assigne pour les issues créées avant la gestion multi-assignés.
 */
export function issueAssignees(issue: Issue | null | undefined): User[] {
  if (issue == null) {
    return [];
  }
  const users = (issue.activeMemberships || [])
    .filter(membership => membership.user != null && membership.role != 'OBSERVER')
    .map(membership => <User>membership.user);
  if (users.length == 0 && issue.assigne != null && issue.assigne.id) {
    return [issue.assigne];
  }
  return users;
}

/** Assignés distincts, du plus chargé au moins chargé, et nombre d'issues sans assigné. */
export function countAssignees(issues: Issue[]): { assignees: AssigneeCount[]; unassigned: number } {
  const byId = new Map<string, AssigneeCount>();
  let unassigned = 0;
  for (const issue of issues || []) {
    const users = issueAssignees(issue);
    if (users.length == 0) {
      unassigned++;
      continue;
    }
    // un même utilisateur ne compte qu'une fois par issue
    const seen = new Set<string>();
    for (const user of users) {
      if (seen.has(user.id)) continue;
      seen.add(user.id);
      const entry = byId.get(user.id);
      if (entry) {
        entry.count++;
      } else {
        byId.set(user.id, {user, count: 1});
      }
    }
  }
  const assignees = Array.from(byId.values()).sort((a, b) =>
    b.count - a.count || userDisplayName(a.user).localeCompare(userDisplayName(b.user)));
  return {assignees, unassigned};
}

/**
 * Issues assignées à l'un des utilisateurs choisis (OU logique). Sans
 * sélection, la liste est renvoyée telle quelle — même référence.
 */
export function filterByAssignees(issues: Issue[], selectedIds: string[]): Issue[] {
  if (!selectedIds || selectedIds.length == 0) {
    return issues || [];
  }
  return (issues || []).filter(issue => {
    const users = issueAssignees(issue);
    return users.length == 0
      ? selectedIds.includes(UNASSIGNED_ID)
      : users.some(user => selectedIds.includes(user.id));
  });
}

export function groupByStatus(issues: Issue[]): Map<number, Issue[]> {
  const grouped = new Map<number, Issue[]>();
  for (const issue of issues || []) {
    const statusId = issue.status?.id;
    if (statusId == null) continue;
    const bucket = grouped.get(statusId);
    if (bucket) {
      bucket.push(issue);
    } else {
      grouped.set(statusId, [issue]);
    }
  }
  return grouped;
}

/**
 * Statuts à afficher : ceux du workflow dans leur ordre, complétés par les
 * statuts portés par des issues mais absents du workflow (autre type,
 * workflow modifié depuis, workflow pas encore chargé) — sans quoi ces
 * issues disparaîtraient de la vue.
 */
export function resolveStatuses(workflowStatuses: Status[] | null | undefined, issues: Issue[]): Status[] {
  const result: Status[] = [];
  const seen = new Set<number>();
  const candidates = [...(workflowStatuses || []), ...(issues || []).map(issue => issue.status)];
  for (const status of candidates) {
    if (status?.id == null || seen.has(status.id)) continue;
    seen.add(status.id);
    result.push(status);
  }
  return result;
}
