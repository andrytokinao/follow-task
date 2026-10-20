import {Injectable} from '@angular/core';
import {Apollo} from "apollo-angular";
import {forkJoin, map, Observable, of} from "rxjs";
import {catchError} from "rxjs/operators";
import {Issue} from "../../type/issue";
import {supprimerTypename} from "../../type/graphql.operations";
import {APERCU_ISSUE, APERCU_SOUS_TACHES} from "../../type/issue-apercu.operations";
import {UserService} from "../../services/user.service";
import {construireApercu, IssueApercu} from "./issue-apercu.model";

/** Données de la popup d'aperçu d'une issue. */
@Injectable({
  providedIn: 'root'
})
export class IssueApercuService {

  constructor(private readonly apollo: Apollo,
              private readonly userService: UserService) {
  }

  /** L'issue et ses sous-tâches, chargées ensemble ; une sous-tâche n'en a pas. */
  charger(issueId: number): Observable<IssueApercu> {
    return forkJoin({
      issue: this.apollo.query<any>({query: APERCU_ISSUE, variables: {issueId}, fetchPolicy: 'network-only'})
        .pipe(map(res => supprimerTypename(res.data.getIssueById) as Issue)),
      sousTaches: this.apollo.query<any>({query: APERCU_SOUS_TACHES, variables: {parentId: issueId}, fetchPolicy: 'network-only'})
        .pipe(
          map(res => (supprimerTypename(res.data.loadSubtask) ?? []) as Issue[]),
          // Sans sous-tâches, l'aperçu reste utile : on n'échoue pas pour elles.
          catchError(() => of([] as Issue[]))),
    }).pipe(map(({issue, sousTaches}) =>
      construireApercu(issue, sousTaches, user => user?.photo ? this.userService.getUrlPhoto(user) : null)));
  }
}
