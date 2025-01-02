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
    console.log("current url :" + state.url);
    this.projectPrefix = route.paramMap.get('project');
    return new Observable<boolean>((observer) => {
      if (this.profile) {
        let permissions: string[] = this.profile.permissions;
        let data: any = route.data;
        this.checkCredencialForProject(data.roles,permissions).subscribe(autorize => {
          observer.next(autorize);
          if (!autorize) {
            this.router.navigate(["private/access-denied"]);
          }
          observer.complete();
        });
      } else {
        this.authService.getProfile().subscribe((profile) => {
          this.profile = profile;
          let permissions: string[] = this.profile.permissions;
          let data:any = route.data;
          this.checkCredencialForProject(data.roles,permissions).subscribe(autorize => {
            observer.next(autorize);
            if (!autorize) {
              this.router.navigate(["private/access-denied"]);
            }
            observer.complete();
          });

        })
      }
    });
  }
  hasCredential(roles:string[]){
    return new Observable<boolean>((observer) => {
      if (this.profile) {
        let permissions: string[] = this.profile.permissions;
        this.checkCredencialForProject(roles,permissions).subscribe(autorize => {
          observer.next(autorize);
          observer.complete();
        });
      } else {
        this.authService.getProfile().subscribe((profile) => {
          this.profile = profile;
          let permissions: string[] = this.profile.permissions;
          this.checkCredencialForProject(roles,permissions).subscribe(autorize => {
            observer.next(autorize);
            observer.complete();
          });

        })
      }
    });
  }
  checkCredencialForProject(toCheck:string[], permissions: string[]){
    return new Observable<boolean>(observer => {
      let authorized = false;
      if (toCheck) {
        if (permissions.includes('CAN_ACCESS_ALL')) {
          observer.next(true);
          observer.complete();
        } else {
          this.addPrefix([...toCheck]).subscribe(projectRole => {
            projectRole.every((role: string) => {
              authorized = permissions.includes(role);
            })
            observer.next(authorized);
            observer.complete();
          });
        }
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
  private addPrefix(toVerifies: string[]) {
    return new Observable<string[]>(observer => {
      const nouvelleListe: string[] = [];
      this.userService.groupeUsers$.subscribe(groupes => {
        if (groupes && groupes.length !=0) {
          for (const groupe of this.groupeUsers) {
            for (const value of toVerifies) {
              nouvelleListe.push(`${groupe.prefix}_${value}`);
            }
          }
          observer.next(nouvelleListe);
          observer.complete();
        } else {
          this.userService.loadGroupeUserForProject(this.projectPrefix);
        }
      })

    })

  }

}

