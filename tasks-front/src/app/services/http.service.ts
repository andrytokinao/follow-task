import {Injectable, Injector} from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { User } from '../type/issue';
import {AuthService} from "./auth.service";
import {RedirectionService} from "./redirection.service";

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {
  private userSubject = new BehaviorSubject<User | null>(null);
  connectedUser$ = this.userSubject.asObservable();

  private lastMessage: string | null = null;
  private isNavigating = false;
  private get authService(): AuthService {
    return this.injector.get(AuthService);
  }
  constructor(
    private router: Router,
    private toastr: ToastrService,
    private injector: Injector,
    private redirection: RedirectionService
  ) {
    // Cet intercepteur écrasait ici `toastr.toastrConfig`, donc la
    // configuration de TOUS les toasts de l'application (position, classe,
    // durée), pas seulement des siens. Les erreurs réseau utilisent
    // désormais la configuration globale d'app.module.ts, comme le reste.
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    req = req.clone({ withCredentials: true });

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          if (this.isLoginPageContent(event.body)) {
            this.handleSessionExpired();
          }
        }
      }),
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            this.handleSessionExpired();
            throw new Error('Utilisateur introuvable');
          }

          if (error.status === 302) {
            console.warn('[HTTP] Redirection détectée, ignorée.');
            return of();
          }

          if (error.status === 0) {
            this.showErrorOnce('Impossible de contacter le serveur. Vérifiez votre connexion réseau.');
            return throwError(() => error);
          }

          if (this.isLoginPage(error.error)) {
            this.handleSessionExpired();
            return of();
          }

          if (error.status !== 200)
            this.showErrorOnce(`Erreur HTTP ${error.status}: ${error.statusText || 'Erreur inconnue'}`);

          if (error.error && typeof error.error.text === 'string') {
            if (error.error.text.includes('<input type="text" id="username" name="username"')) {
              console.log('Le texte contient le champ username !');
              this.handleSessionExpired();

            } else {
              console.log('Le texte ne contient pas le champ username.');
            }
          }
          return of();
        }
        return throwError(() => error);
      })
    );
  }

  private isLoginPageContent(body: any): boolean {
    return typeof body === 'string' && /<form[^>]*class=["']form-signin["']/.test(body);
  }

  private isLoginPage(error: any): boolean {
    if (!error) return false;
    return typeof error === 'string' && /<form[^>]*class=["']form-signin["']/.test(error);
  }

  /** Routes servies par le module public : on y est chez soi sans session. */
  private static readonly PUBLIC_ROUTES = ['/', '/login', '/help'];

  private isOnPublicPage(): boolean {
    const url = this.router.url.split('?')[0].split('#')[0];
    return HttpInterceptorService.PUBLIC_ROUTES.includes(url);
  }

  private handleSessionExpired(): void {
    // Un visiteur de la page d'accueil n'a jamais eu de session : lui annoncer
    // une expiration et le renvoyer vers /login serait faux. On coupe donc la
    // redirection sur les pages publiques, pour qu'un appel de fond en 401 ne
    // puisse pas rendre la vitrine inaccessible.
    if (this.isOnPublicPage()) {
      this.userSubject.next(null);
      return;
    }

    if (this.isNavigating) return;
    this.isNavigating = true;

    // Memorise avant le toast : l'utilisateur peut naviguer pendant les
    // quelques secondes d'affichage, on veut la page ou l'expiration l'a
    // surpris, pas celle ou il se trouve au moment du clic.
    this.redirection.memoriser(this.router.url);

    this.userSubject.next(null);
    this.showErrorOnce('Votre session a expiré. Veuillez vous reconnecter.', () => {
      this.authService.nextConnectedUser(undefined)

      this.router.navigate(['/login']).finally(() => {
        this.isNavigating = false;
      });
    });
  }

  showErrorOnce(message: string, onClose?: () => void): void {
    if (this.lastMessage === message) return;
    this.lastMessage = message;

    this.toastr.error(message).onHidden.subscribe(() => {
      this.lastMessage = null;
      if (onClose) onClose();
    });
  }
}
