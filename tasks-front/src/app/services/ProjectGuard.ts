import {ActivatedRouteSnapshot, CanActivate, NavigationExtras, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs";
import {AuthService} from "./auth.service";
import {Injectable} from "@angular/core";
import {Accessibility, GroupeUser} from "../type/issue";
import {HttpClient} from '@angular/common/http';
import {environment} from "../../environments/environment";
import {UserService} from "./user.service";


@Injectable({
  providedIn: 'root'
})
export class ProjectGuard implements CanActivate {
  projectPrefix:String | undefined;
  profile: any | null = null;
  accessibility: any | null = null;
  groupeUsers:GroupeUser[] = [];
  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private userService:UserService
  ) {

    this.authService.profile$.subscribe(profile => {
      this.profile = profile;
    });
    this.userService.groupeUsers$.subscribe(groups => {
      this.groupeUsers = groups;
    })
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    let data: any = route.data;

    console.debug("canActivate -> checkCredencialForProject : autorize",data);

    console.log("current url :" + state.url);
    this.projectPrefix = route.paramMap.get('project');
    return new Observable<boolean>((observer) => {
      if (this.profile) {
        let permissions: string[] = this.profile.permissions;
        let data: any = route.data;
        this.checkAccessForProject(data.roles,permissions).subscribe(autorize => {
          observer.next(autorize);
          console.debug("canActivate -> checkCredencialForProject : autorize",autorize);
          if (!autorize) {
            this.router.navigate(["working/access-denied"]);
          }
          observer.complete();
        });
      } else {
        // `profile$` peut emettre null (session absente) : sans ce garde, la
        // lecture de `permissions` levait une exception dans le callback et le
        // routeur restait bloque sur une navigation jamais resolue.
        this.authService.getProfile().subscribe({
          next: (profile) => {
            if (!profile?.permissions) {
              return;
            }
            this.profile = profile;
            let permissions: string[] = profile.permissions;
            let data:any = route.data;
            this.checkAccessForProject(data.roles,permissions).subscribe(autorize => {
              observer.next(autorize);
              console.debug("canActivate -> getProfile -> checkCredencialForProject : autorize",autorize);
              if (!autorize) {
                this.router.navigate(["working/access-denied"]);
              }
              observer.complete();
            });
          },
          error: () => {
            observer.next(false);
            observer.complete();
          }
        })
      }
    });
  }
  hasCredential(roles:string[]){
    return new Observable<boolean>((observer) => {
      if (this.profile) {
        let permissions: string[] = this.profile.permissions;
        this.checkAccessForProject(roles,permissions).subscribe(autorize => {
          observer.next(autorize);
          observer.complete();
        });
      } else {
        this.authService.getProfile().subscribe((profile) => {
          this.profile = profile;
          let permissions: string[] = this.profile.permissions;
          this.checkAccessForProject(roles,permissions).subscribe(autorize => {
            observer.next(autorize);
            observer.complete();
          });

        })
      }
    });
  }
  hasSimpleCredential(roles:string[]){
    return new Observable<boolean>((observer) => {
      if (this.profile) {
        let permissions: string[] = this.profile.permissions;
        this.checkPersmisionsForProject(roles,permissions).subscribe(autorize => {
          observer.next(autorize);
          observer.complete();
        });
      } else {
        this.authService.getProfile().subscribe((profile) => {
          this.profile = profile;
          let permissions: string[] = this.profile.permissions;
          this.checkPersmisionsForProject(roles,permissions).subscribe(autorize => {
            observer.next(autorize);
            observer.complete();
          });

        })
      }
    });
  }
  checkAccessForProject(toCheck:string[], permissions: string[]){
    return new Observable<boolean>(observer => {
      let authorized = false;
      if (toCheck) {
        if (permissions.includes('CAN_ACCESS_ALL')) {
          observer.next(true);
          observer.complete();
        } else {
          this.addPrefix([...toCheck]).subscribe({
            next: projectRole => {
              // `every` avec un callback sans return s'arretait au premier
              // element : seul le premier role etait reellement teste.
              authorized = projectRole.some((role: string) => permissions.includes(role));
              observer.next(authorized);
              observer.complete();
            },
            error: () => {
              observer.next(false);
              observer.complete();
            }
          });
        }
      } else {
        console.error("non data");
        observer.next(false);
        observer.complete();
      }
    })
  }
  checkPersmisionsForProject(toCheck:string[], permissions: string[]){
    return new Observable<boolean>(observer => {
      let authorized = false;
      if (toCheck) {
          this.addPrefix([...toCheck]).subscribe({
            next: projectRole => {
              authorized = projectRole.some((role: string) => permissions.includes(role));
              observer.next(authorized);
              observer.complete();
            },
            error: () => {
              observer.next(false);
              observer.complete();
            }
          });
      } else {
        console.error("non data");
        observer.next(false);
        observer.complete();
      }
    })
  }
  getAccessibility() {
    return new Observable<Accessibility>((observer) => {
      if (this.accessibility) {
        observer.next(this.accessibility);
        observer.complete();
      } else {
        this.http.get<Accessibility>( environment.apiURL+"api/accessibility", {
          observe: 'response',
          withCredentials: true
        }).subscribe((res) => {
          this.accessibility = res.body;
          console.log(this.accessibility);
          observer.next(this.accessibility);
          observer.complete();
        }, err => {
          console.error(err);
          observer.error(err);
          observer.complete();
        })
      }
    })
  }
  hasAutorityAsync(autorities:String[]){
    return new Observable<boolean>((observer) =>{
      this.authService.getProfile().subscribe((profile:any) => {
        if (profile.permissions.includes('CAN_ACCESS_ALL')) {
          observer.next(true);
          observer.complete();
        } else {
          let authorized:boolean = autorities.every((role: string) => profile.permissions.includes(role));
          observer.next(authorized);
          observer.complete();
        }
      },error => {
        observer.error(error);
        observer.complete();
      })
    });
  }
  hasAutority(autorities:String[]){
    autorities.push('CAN_ACCESS_ALL');
    return  autorities.every((role: string) => this.profile.permissions.includes(role));
  }
  hasAutorityInProject(toVerifies: string[]) {
   // return this.hasAutorityAsync(this.addPrefix(toVerifies));
  }
  /**
   * Prefixe les roles demandes par ceux des groupes de l'utilisateur sur le
   * projet courant.
   *
   * Le chargement des groupes n'est declenche qu'une fois. Auparavant, chaque
   * emission vide de `groupeUsers$` relancait la requete : quand le projet ne
   * renvoyait aucun groupe (droits absents, ou reponse en erreur avalee par
   * l'intercepteur), la liste restait vide, le garde n'emettait jamais et le
   * routeur attendait indefiniment — d'ou l'ecran blanc sur /working/:project,
   * accompagne d'une boucle de requetes.
   */
  private addPrefix(toVerifies: string[]) {
    return new Observable<string[]>(observer => {
      let chargementDemande = false;

      const abonnement = this.userService.groupeUsers$.subscribe(groupes => {
        if (groupes && groupes.length !== 0) {
          const nouvelleListe: string[] = [];
          for (const groupe of groupes) {
            for (const value of toVerifies) {
              nouvelleListe.push(`${groupe.prefix}_${value}`);
            }
          }
          observer.next(nouvelleListe);
          observer.complete();
          return;
        }

        if (chargementDemande) {
          // Les groupes ont ete charges et le projet n'en a aucun pour cet
          // utilisateur : c'est une reponse, pas une attente. On tranche.
          observer.next([]);
          observer.complete();
          return;
        }
        chargementDemande = true;
        this.userService.loadGroupeUserForProject(this.projectPrefix);
      });

      return () => abonnement.unsubscribe();
    })

  }

}

