import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {CookieService} from "ngx-cookie-service";
import {BehaviorSubject, Observable} from "rxjs";
import {User} from "../type/issue";
import {environment} from "../../environments/environment";
import {UserService} from "./user.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  profile = null;
  userSubject = new BehaviorSubject<User>(null);
  connectedUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private cookieService: CookieService,
    private userService:UserService
  ) {
  }

  login(username: string, password: string) {
    const url = +environment.apiURL+'login';
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
      'Origin': 'http://localhost:4200',
      'Referer': environment.apiURL+'login',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1'
    });

    const body = new FormData();
    body.append('username', username);
    body.append('password', password);
    return new Observable<any>((observer)=>{
      this.http.post(environment.apiURL+'login', body, {observe: 'response',withCredentials:true}).subscribe(
        (res:any)=>{
          if(res.body.result == 'success') {
            observer.next("success");
            observer.complete();
          } else {
            observer.next("failed");
            observer.complete();
          }
        },
        (error :any)=> {
          if(error.body.result == 'success') {
            observer.next("success");
            observer.complete();
          } else {
            observer.next("failed");
            observer.complete();
          }
        }
      );

    })
  }

  getProfile() {
    return new Observable((observer) => {
        if (this.profile) {
          observer.next(this.profile);
          observer.complete();
        } else {
          this.http.get(environment.apiURL+"api/profile",{withCredentials:true}).subscribe(
            (res: any) => {
            if (JSON.stringify(res).localeCompare('login') === -1) {
              localStorage.setItem("user", res);
              this.profile = res;
              observer.next(this.profile);
              this.loadConnectedUser();
              observer.complete();
            } else {
              observer.error("Connection failed");
              observer.complete();
            }
          },(err)=>{
              console.error(JSON.stringify(err));
              observer.error(err);
              observer.complete();
            }
          );
        }
      }
    )
  }
  loadConnectedUser(){
    this.profile.username;
    this.userService.getUser(this.profile.username).subscribe(res => {
      this.userSubject.next(res);
      }
    )
  }
  logout(){
    this.profile = null;
    return this.http.get(environment.apiURL+'logout',{withCredentials:true});
  }

}
