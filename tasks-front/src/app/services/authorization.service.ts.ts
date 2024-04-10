import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs";
import {AuthService} from "./auth.service";
import {Injectable} from "@angular/core";
import {User} from "../type/issue";
import {ConfigService} from "./config.service";

@Injectable({
  providedIn: 'root'
})
export class NotLogIn implements CanActivate {

  constructor(private authService: AuthService, private router: Router, private hasRole: AuthorizeRoleGuard) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // TODO : a investiger le bouble infini dans cette partie
    return new Observable<boolean>(observer => {
      return this.hasRole.canActivate([]).subscribe(acc => {
        console.info(JSON.stringify(acc));
        if (!acc) {
          observer.next(true);
          observer.complete();
        } else {
          this.router.navigate(['/private'])
          observer.next(false)
          observer.complete();
        }
      }, error => {
        console.info(JSON.stringify(error));
        observer.next(true);
        observer.complete();
      });
    })
  }
}


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router, private hasRole: AuthorizeRoleGuard) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.hasRole.canActivate([]);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {
  profile: User | null = null;

  constructor(private authService: AuthService, private configService: ConfigService, private router: Router, private hasRole: AuthorizeRoleGuard) {
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.hasRole.canActivate(['super-admin']);
  }
}


@Injectable({
  providedIn: 'root'
})
export class AdminnGuard implements CanActivate {
  profile: User | null = null;

  constructor(private authService: AuthService, private router: Router, private hasRole: AuthorizeRoleGuard) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.hasRole.canActivate(['CAN_CREATE_USER', 'CAN_DELETE_USER', 'CAN_MANAGE_ROLES', 'CAN_CONFIGURE_SYSTEM', 'CAN_MANAGE_SECURITY', 'CAN_MANAGE_BACKUPS']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizeRoleGuard {

  constructor(private authService: AuthService, private configService: ConfigService, private router: Router) {
  }

  canActivate(roles: string[]): Observable<boolean> {
    return new Observable((obsever) => {
      this.authService.getProfile().subscribe(
        (profile: any) => {
          if (roles === null || roles.length === 0) {
            if (!this.configService.isComplete()) {
              this.router.navigate(['/installation/work-space'])
              obsever.next(false);
              obsever.complete();
            } else {
              // ACCEPTÉ
              obsever.next(true);
              obsever.complete();
            }
          } else {
            let permissions: string[] = profile.permissions;
            if (permissions == null || permissions.length === 0) {
              this.router.navigate(['/private/access-denied'])
              obsever.next(false);
              obsever.complete();
            } else {
              let hasRole: boolean = false;
              for (const role of roles) {
                if (permissions.includes(role)) {
                  hasRole = true;
                  break;
                }
              }
              if (hasRole) {
                if (!this.configService.isComplete()) {
                  console.log('installation');
                  this.router.navigate(['/installation/work-space'])
                  obsever.next(false);
                  obsever.complete();
                } else {
                  // ACCEPTÉ
                  obsever.next(true);
                  obsever.complete();
                }
              } else {
                this.router.navigate(['/private/access-denied'])
                obsever.next(false);
                obsever.complete();
              }
            }
          }
        }, error => {
          this.router.navigate(['/public/login']);
          obsever.next(false);
          obsever.complete();
        })
    })
  }
}

@Injectable({
  providedIn: 'root'
})
export class InstallationGuard implements CanActivate {

  constructor(private authService: AuthService, private configService: ConfigService, private router: Router) {
  }
  roles:string[] =['CAN_CREATE_USER', 'CAN_DELETE_USER', 'CAN_MANAGE_ROLES', 'CAN_CONFIGURE_SYSTEM', 'CAN_MANAGE_SECURITY', 'CAN_MANAGE_BACKUPS'];
  canActivate(): Observable<boolean> {
    return new Observable((obsever) => {
      this.authService.getProfile().subscribe(
        (profile: any) => {
          let hasRole: boolean = false;
            let permissions: string[] = profile.permissions;
            if (permissions == null || permissions.length === 0 ) {
              hasRole = false;
            } else {
              for (const role of this.roles) {
                if (permissions.includes(role)) {
                  hasRole = true;
                  break;
                }
              }
            }
          if (hasRole && !this.configService.isComplete()) {
              obsever.next(true);
              obsever.complete();
          } else {
            this.router.navigate(['/private/access-denied']);
            obsever.next(false);
            obsever.complete();
          }

        }, error => {
          this.router.navigate(['/public/login']);
          obsever.next(false);
          obsever.complete();
        })
    })
  }
}

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(private authService: AuthService, private configService: ConfigService, private router: Router) {
  }
  canActivate(): Observable<boolean> {
    return new Observable((obsever) => {
      this.authService.getProfile().subscribe(
        (profile: any) => {
          this.router.navigate(['/private/home']);
          obsever.next(false);
          obsever.complete();
        }, error => {
          this.configService.checkUser().subscribe(
            (existe)=>{
              if(existe){
               obsever.next(true);
               obsever.complete();
             }else {
               obsever.next(false);
               obsever.complete();
               this.router.navigate(['/installation/create-user-admin']);
             }
            },(error)=>{
              console.error(error);
            }
          )

        })
    })
  }
}

