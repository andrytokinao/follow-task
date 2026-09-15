import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from "@angular/router";
import {Injectable} from "@angular/core";
import {Apollo} from "apollo-angular";
import {Observable, of, throwError} from "rxjs";
import {catchError, filter, map, shareReplay, switchMap, take, tap, timeout} from "rxjs/operators";
import {AuthService} from "./auth.service";
import {ProjectGuard} from "./ProjectGuard";
import {ISSUE_ACCESSIBILITIES} from "../type/graphql.operations";


/**
 * Garde d'une issue (master ou sous-issue), pendant de {@link ProjectGuard}.
 *
 * L'acces est hierarchise, du plus large au plus fin :
 *  1. `CAN_ACCESS_ALL` (administrateur systeme) ;
 *  2. les roles de l'espace de travail, via {@link ProjectGuard} : un
 *     PROJECT_MANAGER ou ADMIN du projet l'est aussi sur chacune de ses issues,
 *     sans requete supplementaire ;
 *  3. sinon, les accessibilites que le serveur calcule sur cette issue a
 *     partir des assignations sur l'issue et ses ancetres (voir
 *     `issue-authorization` dans application.yml). Etre assigne a une issue
 *     master donne ainsi les droits de PROJECT_MANAGER sur celle-ci.
 *
 * Il suffit donc de `canActivate: [MasterGuard]` : `[ProjectGuard, MasterGuard]`
 * exigerait les deux (ET), et bloquerait un simple assigne.
 *
 * Le resultat est mis en cache par issue ; appeler `invalidate()` apres une
 * (des)assignation.
 */
@Injectable({
  providedIn: 'root'
})
export class MasterGuard implements CanActivate {
  private accessibilitiesCache = new Map<string, Observable<string[]>>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private apollo: Apollo,
    private projectGuard: ProjectGuard
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const params = this.collectParams(route);
    const data: any = route.data;
    // Sur une sous-issue on juge la sous-issue : ses ancetres sont pris en compte cote serveur.
    const issueKey = params['subtaskKey'] ?? params['parrentIssue'];
    return this.hasIssueCredential(data.roles, params['project'], issueKey).pipe(
      tap(autorize => {
        console.debug("canActivate -> MasterGuard : autorize", autorize);
        if (!autorize) {
          this.router.navigate(["working/access-denied"]);
        }
      })
    );
  }

  /**
   * Vrai si l'utilisateur possede au moins un des roles sur l'issue.
   */
  hasIssueCredential(roles: string[], projectPrefix: string | null | undefined, issueKey: string | null | undefined): Observable<boolean> {
    if (!roles || roles.length === 0 || !projectPrefix || !issueKey) {
      console.error("MasterGuard : roles, projet ou issue manquant", roles, projectPrefix, issueKey);
      return of(false);
    }
    return this.authService.getProfile().pipe(
      filter((profile: any) => !!profile?.permissions),
      take(1),
      switchMap((profile: any) => {
        if (profile.permissions.includes('CAN_ACCESS_ALL')) {
          return of(true);
        }
        return this.hasProjectCredential(roles, projectPrefix).pipe(
          switchMap(projectAutorize => projectAutorize
            ? of(true)
            : this.issueAccessibilities(projectPrefix, issueKey).pipe(
              map(accessibilities => roles.some(role => accessibilities.includes(role)))
            ))
        );
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Niveau espace de travail. Un echec ou une attente trop longue (groupes du
   * projet jamais charges) ne refuse pas l'acces : on retombe sur le niveau issue.
   */
  private hasProjectCredential(roles: string[], projectPrefix: string): Observable<boolean> {
    // ProjectGuard ne connait le projet que s'il a lui-meme garde une route.
    this.projectGuard.projectPrefix = projectPrefix;
    return this.projectGuard.hasCredential([...roles]).pipe(
      take(1),
      timeout(5000),
      catchError(() => of(false))
    );
  }

  issueAccessibilities(projectPrefix: string, issueKey: string): Observable<string[]> {
    const cacheKey = `${projectPrefix}/${issueKey}`;
    let cached = this.accessibilitiesCache.get(cacheKey);
    if (!cached) {
      cached = this.apollo.query({
        query: ISSUE_ACCESSIBILITIES,
        variables: {projectPrefix, issueKey},
        fetchPolicy: 'network-only'
      }).pipe(
        map((res: any) => (res.data?.issueAccessibilities ?? []) as string[]),
        catchError(error => {
          // Une erreur ne doit pas rester en cache : la prochaine navigation retente.
          this.accessibilitiesCache.delete(cacheKey);
          return throwError(() => error);
        }),
        shareReplay(1)
      );
      this.accessibilitiesCache.set(cacheKey, cached);
    }
    return cached;
  }

  /**
   * Oublie les accessibilites calculees : a appeler apres une modification
   * des assignations ou des groupes du projet.
   */
  invalidate() {
    this.accessibilitiesCache.clear();
  }

  /**
   * Les parametres `project` et `parrentIssue` sont portes par des routes
   * ancetres ; le routeur ne les herite pas sur les routes a chemin non vide.
   */
  private collectParams(route: ActivatedRouteSnapshot): { [key: string]: string } {
    return route.pathFromRoot.reduce((params, snapshot) => ({...params, ...snapshot.params}), {});
  }
}
