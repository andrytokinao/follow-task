import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from "@angular/router";
import {Injectable} from "@angular/core";
import {Apollo} from "apollo-angular";
import {Observable, of, throwError} from "rxjs";
import {catchError, filter, map, shareReplay, switchMap, take, tap} from "rxjs/operators";
import {AuthService} from "./auth.service";
import {ISSUE_ACCESSIBILITIES} from "../type/graphql.operations";


/**
 * Garde d'une issue (master ou sous-issue), pendant de {@link ProjectGuard}.
 *
 * L'acces est hierarchise, du plus large au plus fin :
 *  1. `CAN_ACCESS_ALL` (administrateur systeme) ;
 *  2. les roles de l'espace de travail : les memes permissions que verifie
 *     {@link ProjectGuard} (`PRJ_GROUPE_ROLE`), lues directement dans le
 *     profil, sans attendre le chargement des groupes du projet. Un
 *     PROJECT_MANAGER ou ADMIN du projet l'est aussi sur chacune de ses issues ;
 *  3. sinon, les accessibilites que le serveur calcule sur cette issue a
 *     partir des assignations sur l'issue et ses ancetres (voir
 *     `issue-authorization` dans application.yml). L'assigne d'une issue y
 *     travaille sans pouvoir la reassigner, et gere toutes ses sous-taches
 *     (creation, assignation...).
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
  private profile: any | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private apollo: Apollo
  ) {
    this.authService.profile$.subscribe(profile => this.profile = profile);
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
        if (this.checkProjectCredential(roles, projectPrefix, profile.permissions)) {
          return of(true);
        }
        return this.issueAccessibilities(projectPrefix, issueKey).pipe(
          map(accessibilities => roles.some(role => accessibilities.includes(role)))
        );
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Niveau systeme + espace de travail, synchrone.
   * @return null tant que le profil n'est pas charge
   */
  hasProjectCredential(roles: string[], projectPrefix: string | null | undefined): boolean | null {
    const permissions: string[] | undefined = this.profile?.permissions;
    if (!permissions) {
      return null;
    }
    return this.checkProjectCredential(roles, projectPrefix, permissions);
  }

  private checkProjectCredential(roles: string[], projectPrefix: string | null | undefined, permissions: string[]): boolean {
    if (permissions.includes('CAN_ACCESS_ALL')) {
      return true;
    }
    // Meme convention que le serveur (GroupeUser.projectGroupePrefix).
    return !!projectPrefix && roles.some(role => permissions.includes(`${projectPrefix}_GROUPE_${role}`));
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
