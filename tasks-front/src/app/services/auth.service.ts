import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, of, throwError} from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment';
import { User } from '../type/issue';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private profile: any | null = null;

  private userSubject = new BehaviorSubject<User | null>(null);
  connectedUser$ = this.userSubject.asObservable();

  private profileSubject = new BehaviorSubject<any | null>(null);
  profile$ = this.profileSubject.asObservable();

  private profileLoading = false;

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private userService: UserService
  ) {}

  login(username: string, password: string): Observable<'success' | 'failed'> {
    const body = new FormData();
    body.append('username', username);
    body.append('password', password);

    return this.http
      .post<any>(`${environment.apiURL}login`, body, {
        observe: 'response',
        withCredentials: true
      })
      .pipe(
        map((res: any): 'success' | 'failed' =>
          res.body?.result === 'success' ? 'success' : 'failed'
        ),
        catchError((): Observable<'failed'> => of('failed'))
      );
  }

  getProfile(forceRefresh = false): Observable<any> {
    if (this.profile && !forceRefresh) {
      return this.profile$;
    }

    if (this.profileLoading) {
      return this.profile$;
    }

    this.profileLoading = true;

    this.http
      .get<any>(`${environment.apiURL}api/profile`, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.profile = res;
          this.profileSubject.next(res);
          this.loadConnectedUser();
          this.profileLoading = false;
        }),
        catchError((err) => {
          console.error('Erreur chargement profile', err);
          this.profile = null;
          this.profileSubject.next(null);
          this.profileLoading = false;
          return throwError(() => err);
        })
      )
      .subscribe();

    return this.profile$;
  }

  private loadConnectedUser(): void {
    if (!this.profile?.username) return;

    this.userService.getUser(this.profile.username).subscribe((res) => {
      this.userSubject.next(res);
    });
  }

  logout(): Observable<any> {
    this.profile = null;
    this.profileSubject.next(null);
    this.userSubject.next(null);
    return this.http.get(`${environment.apiURL}logout`, {
      withCredentials: true
    });
  }

  verificationCodeReset(phone: string, code: string) {
    return this.http.get(
      `${environment.apiURL}verify-code?phone=${phone}&code=${code}`,
      { observe: 'response', withCredentials: true }
    );
  }

  contactValidator(contact: string): boolean {
    const contactPattern = /^(0(34|33|32|38)|\+261(34|33|32|38))\d{7}$/;
    return contactPattern.test(contact);
  }

  resetPassword(phone: string) {
    return this.http.get(`${environment.apiURL}reset-password?phone=${phone}`, {
      observe: 'response',
      withCredentials: true
    });
  }

  newPassword(phone: string, password: string, code: string) {
    return this.http.get(
      `${environment.apiURL}new-password?phone=${phone}&code=${code}&password=${password}`,
      { observe: 'response', withCredentials: true }
    );
  }

}
