import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs";
import {AuthService} from "./auth.service";
import {Injectable} from "@angular/core";
import {User} from "../type/issue";

@Injectable({
  providedIn: 'root'
})
export class NotLogIn implements CanActivate {

  constructor(private authService: AuthService, private router: Router, private hasRole:AuthorizeRoleGuard) {
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // TODO : a investiger le bouble infini dans cette partie
    return new Observable<boolean>(observer=>{
      return this.hasRole.canActivate([]).subscribe(acc=>{
        console.info(JSON.stringify(acc));
        if(!acc) {
          observer.next(true);
          observer.complete();
        } else {
          this.router.navigate(['/private'])
          observer.next(false)
          observer.complete();
        }
      },error => {
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

  constructor(private authService: AuthService, private router: Router, private hasRole:AuthorizeRoleGuard) {
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

  constructor(private authService: AuthService, private router: Router, private hasRole:AuthorizeRoleGuard) {
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

  constructor(private authService: AuthService, private router: Router, private hasRole:AuthorizeRoleGuard) {
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.hasRole.canActivate(['CAN_CREATE_USER','CAN_DELETE_USER','CAN_MANAGE_ROLES','CAN_CONFIGURE_SYSTEM','CAN_MANAGE_SECURITY','CAN_MANAGE_BACKUPS']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizeRoleGuard {

  constructor(private authService: AuthService, private router: Router) {
  }

  canActivate(roles: string[]): Observable<boolean> {
    return new Observable((obsever) => {
      this.authService.getProfile().subscribe(
        (profile: any) => {
          if (roles === null || roles.length === 0) {
            obsever.next(true);
            obsever.complete();
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
                obsever.next(true);
                obsever.complete();
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
