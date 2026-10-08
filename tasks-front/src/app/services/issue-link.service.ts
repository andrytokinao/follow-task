import {Injectable} from '@angular/core';
import {Apollo} from "apollo-angular";
import {map, Observable} from "rxjs";
import {DependencyMode, IssueLink, LinkType} from "../type/issue";
import {supprimerTypename} from "../type/graphql.operations";
import {
  INCOMING_ISSUE_LINKS,
  LINK_ISSUES,
  OUTGOING_ISSUE_LINKS,
  UNLINK_ISSUES,
  UPDATE_ISSUE_LINK
} from "../type/issue-link.operations";

/** Liens entre tâches : prédécesseur, bloquant, déclencheur, simple référence. */
@Injectable({
  providedIn: 'root'
})
export class IssueLinkService {

  constructor(private apollo: Apollo) {
  }

  /** Liens dont la tâche est la source : « A bloque B ». */
  outgoingLinks(issueId: number): Observable<IssueLink[]> {
    return this.apollo.query<any>({
      query: OUTGOING_ISSUE_LINKS,
      variables: {issueId},
      fetchPolicy: 'network-only'
    }).pipe(map(res => supprimerTypename(res.data.outgoingIssueLinks) ?? []));
  }

  /** Liens dont la tâche est la destination : « B est bloquée par A ». */
  incomingLinks(issueId: number): Observable<IssueLink[]> {
    return this.apollo.query<any>({
      query: INCOMING_ISSUE_LINKS,
      variables: {issueId},
      fetchPolicy: 'network-only'
    }).pipe(map(res => supprimerTypename(res.data.incomingIssueLinks) ?? []));
  }

  /** Refusé par le serveur si le lien crée une boucle de dépendances. */
  link(sourceId: number, destinationId: number, type: LinkType,
       mode?: DependencyMode, lagDays?: number): Observable<IssueLink> {
    return this.apollo.mutate<any>({
      mutation: LINK_ISSUES,
      variables: {sourceId, destinationId, type, mode, lagDays}
    }).pipe(map(res => supprimerTypename(res.data.linkIssues)));
  }

  update(linkId: number, mode?: DependencyMode, lagDays?: number): Observable<IssueLink> {
    return this.apollo.mutate<any>({
      mutation: UPDATE_ISSUE_LINK,
      variables: {linkId, mode, lagDays}
    }).pipe(map(res => supprimerTypename(res.data.updateIssueLink)));
  }

  unlink(linkId: number): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: UNLINK_ISSUES,
      variables: {linkId}
    }).pipe(map(res => !!res.data.unlinkIssues));
  }
}
