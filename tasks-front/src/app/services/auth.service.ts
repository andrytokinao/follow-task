import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {BehaviorSubject, mergeMap, Observable, of, throwError} from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment';
import { User } from '../type/issue';
import { UserService } from './user.service';
import {Router} from "@angular/router";
import {RedirectionService} from "./redirection.service";

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
  private connectedLoading = false;
  /**
   * Deux chemins declenchent la redirection post-connexion (le chargement du
   * profil et celui de l'utilisateur connecte). Sans ce garde, le second
   * ecraserait la destination memorisee par une navigation vers /working.
   */
  private redirectionDemandee = false;

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private userService: UserService,
    private router:Router,
    private redirection: RedirectionService
  ) {}

  login(username: string, password: string): Observable<'success' | string> {
    const body = new FormData();
    body.append('username', username);
    body.append('password', password);

    return new Observable(observer => {
      this.http.post<any>(`${environment.apiURL}login`, body, {
        observe: 'response',
        withCredentials: true
      }).subscribe({
        next: (res) => {
          if (res.body?.result === 'success') {
            observer.next('success');
          } else {
            observer.error('Mot de passe incorrect');
          }
          observer.complete();
        },
        error: (err) => {
          console.error('Erreur HTTP:', err);
          observer.error('Erreur de connexion');
          observer.complete();
        }
      });
    });

  }

  /**
   * Sequence de fin de connexion : un seul chargement de profil, puis la
   * redirection.
   *
   * L'ecran de connexion enchainait auparavant getProfile(true), loadProfile()
   * et loadConnectedUserByUsername() : trois declencheurs pour le meme etat,
   * soit jusqu'a six requetes concurrentes (visibles dans les logs serveur en
   * autant de "Inding by login"), et une redirection en course avec un
   * chargement de profil encore en vol.
   */
  finaliserConnexion(): void {
    this.redirectionDemandee = false;
    this.profileLoading = true;
    this.chargerProfil().subscribe({
      next: () => this.redirigerApresConnexion(),
      // En echec, chargerProfil a deja renvoye vers /login.
      error: () => {}
    });
  }

  /**
   * Renvoie l'utilisateur la ou son expiration de session l'a interrompu, ou
   * a defaut sur l'espace de travail.
   */
  redirigerApresConnexion(): void {
    if (this.redirectionDemandee) {
      return;
    }
    this.redirectionDemandee = true;
    const cible = this.redirection.consommer();
    this.router.navigateByUrl(cible || '/working/')
      .then(ok => {
        // La cible memorisee peut avoir disparu ou etre refusee par un garde :
        // on ne laisse pas l'utilisateur sur la page de connexion.
        if (!ok && cible) {
          this.router.navigate(['/working']);
        }
      })
      .catch(() => this.router.navigate(['/working']));
  }
  getProfile(forceRefresh = false): Observable<any> {
    if (this.profile && !forceRefresh) {
      return this.profile$;
    }

    if (this.profileLoading) {
      return this.profile$;
    }

    this.profileLoading = true;
    this.loadProfile();
    return this.profile$;
  }
  loadProfile(){
    this.chargerProfil().subscribe({ error: () => {} });
  }

  /**
   * Requete de profil partagee par loadProfile() et finaliserConnexion().
   * Ne declenche rien par elle-meme : c'est l'appelant qui s'abonne, et qui
   * decide ce qu'il fait du resultat.
   */
  private chargerProfil(): Observable<any> {
    return this.http
      .get<any>(`${environment.apiURL}api/profile`, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.profile = res;
          this.profileSubject.next(res);
          this.loadConnectedUser();
          this.profileLoading = false;
        }),
        catchError((err) => {
          this.redirection.memoriser(this.router.url);
          this.redirectionDemandee = false;
          this.router.navigate(["/login"]);
          console.error('Erreur chargement profile', err);
          this.profile = null;
          this.profileSubject.next(null);
          this.profileLoading = false;
          return throwError(() => err);
        })
      );
  }
  loadConnectedUser(): void {
    if (!this.profile?.username) return;

    if(this.connectedLoading)
      return;
     this.connectedLoading = true;
    this.userService.getUser(this.profile.username).subscribe((res) => {
      this.userSubject.next(res);
      this.connectedLoading = false;
    });
  }

  logout(): Observable<any> {
    // Deconnexion volontaire : on oublie la destination memorisee, sinon la
    // prochaine connexion ramenerait sur une page que l'utilisateur a quittee
    // deliberement.
    this.redirection.oublier();
    this.redirectionDemandee = false;
    return this.http.get(`${environment.apiURL}logout`, { withCredentials: true, responseType: 'text' })
      .pipe(
        tap(() => {
          this.profile = null;
          this.profileSubject.next(null);
          this.userSubject.next(null);
        }),
        catchError((error) => {
          if (error.status === 200 || error.status === 302) {
            this.profile = null;
            this.profileSubject.next(null);
            this.userSubject.next(null);
            return of(null);
          }
          console.error('[Logout Error]', error);
          return throwError(() => new Error('Échec de la déconnexion.'));
        })
      );
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

  nextConnectedUser(user: undefined) {
    this.userSubject.next(user);
    this.profileSubject.next(user);
    // Appele lors d'une expiration de session : la prochaine connexion doit
    // pouvoir rediriger a nouveau.
    this.redirectionDemandee = false;
  }
}
