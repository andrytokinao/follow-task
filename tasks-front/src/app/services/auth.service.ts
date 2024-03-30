import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {CookieService} from "ngx-cookie-service";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  profile = null;

  constructor(private http: HttpClient, private cookieService: CookieService) {
  }

  login(username: string, password: string) {
    const url = 'http://localhost:8081/login';
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
      'Origin': 'http://localhost:4200',
      'Referer': 'http://localhost:8081/login',
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
    return this.http.post('http://localhost:8081/login', body, {observe: 'response',withCredentials:true});
  }

  getProfile() {
    return new Observable((observer) => {
        if (this.profile) {
          observer.next(this.profile);
          observer.complete();
        } else {
          this.http.get("http://localhost:8081/api/profile",{withCredentials:true}).subscribe(
            (res: any) => {
              console.info(JSON.stringify(res));
            if (JSON.stringify(res).localeCompare('login') === -1) {
              localStorage.setItem("user", res);
              this.profile = res;
              observer.next(this.profile);
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
  logout(){
    this.profile = null;
    return this.http.get('http://localhost:8081/logout',{withCredentials:true});
  }

}
