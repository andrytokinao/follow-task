import {Injectable} from '@angular/core';
import {Apollo} from "apollo-angular";
import {combineLatest, map, Observable, of} from "rxjs";
import {catchError, startWith} from "rxjs/operators";
import {Issue, User} from "../../type/issue";
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

  /**
   * L'issue et ses sous-tâches, demandées en même temps. L'aperçu est rendu dès
   * que l'issue arrive, sous-tâches « en cours » ; il l'est de nouveau avec
   * elles. Hors cache Apollo (`no-cache`) : l'écrire relançait les requêtes
   * suivies par la page sous la popup (planning, Gantt), et c'était ce qui
   * ralentissait l'affichage, pas le serveur.
   */
  charger(issueId: number): Observable<IssueApercu> {
    const photoDe = (user: User) => user?.photo ? this.userService.getUrlPhoto(user) : null;
    const issue$ = this.apollo.query<any>({query: APERCU_ISSUE, variables: {issueId}, fetchPolicy: 'no-cache'})
      .pipe(map(res => supprimerTypename(res.data.getIssueById) as Issue));
    const sousTaches$ = this.apollo.query<any>({query: APERCU_SOUS_TACHES, variables: {parentId: issueId}, fetchPolicy: 'no-cache'})
      .pipe(
        map(res => (supprimerTypename(res.data.loadSubtask) ?? []) as Issue[]),
        // Sans sous-tâches, l'aperçu reste utile : on n'échoue pas pour elles.
        catchError(() => of([] as Issue[])),
        startWith(null as Issue[] | null));
    return combineLatest([issue$, sousTaches$])
      .pipe(map(([issue, sousTaches]) => construireApercu(issue, sousTaches, photoDe)));
  }
}
