import {ActivatedRouteSnapshot, CanActivate, NavigationExtras, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs";
import {AuthService} from "./auth.service";
import {Injectable} from "@angular/core";
import {Accessibility} from "../type/issue";
import {HttpClient} from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  profile: any | null = null;
  accessibility: any | null = null;

  constructor(private authService: AuthService, private router: Router, private http: HttpClient) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    console.log("current url :" + state.url);
    return new Observable<boolean>((observer) => {
      if (this.profile) {
        let permissions: string[] = this.profile.permissions;
        let data: any = route.data;
        if (data && data.roles) {
          data.roles.push('CAN_ACCESS_ALL');
          let authorized = false;
          if (permissions.includes('CAN_ACCESS_ALL')) {
            authorized = true;
          } else {
            authorized = data.roles.every((role: string) => permissions.includes(role));
          }

          if (authorized) {
            observer.next(true);
            observer.complete();
          } else {
            observer.next(false);
            observer.complete();
            this.router.navigate(["private/access-denied"]);
          }
        } else {
          alert("non data");
        }
      } else {
        this.authService.getProfile().subscribe((profile) => {
          this.profile = profile;
          let permissions: string[] = this.profile.permissions;
          let data: any = route.data;
          if (data && data.roles) {
            data.roles.push('CAN_ACCESS_ALL');
            let authorized = false;
            if (permissions.includes('CAN_ACCESS_ALL')) {
              authorized = true;
            } else {
              authorized = data.roles.every((role: string) => permissions.includes(role));
            }
            if (authorized) {
              observer.next(true);
              observer.complete();
            } else {
              observer.next(false);
              observer.complete();
              this.router.navigate(["private/access-denied"]);
            }
          } else {
            console.error("non data");
          }
        })
      }
    });

  }

  getAccessibility() {
    return new Observable<Accessibility>((observer) => {
      if (this.accessibility) {
        observer.next(this.accessibility);
        observer.complete();
      } else {
        this.http.get<Accessibility>("http://localhost:8081/api/accessibility", {
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
}

