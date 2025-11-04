import { Injectable } from '@angular/core';
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
import { ToastrService, GlobalConfig } from 'ngx-toastr';
import { User } from '../type/issue';

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {
  private userSubject = new BehaviorSubject<User | null>(null);
  connectedUser$ = this.userSubject.asObservable();

  private lastMessage: string | null = null;
  private isNavigating = false;

  constructor(
    private router: Router,
    private toastr: ToastrService
  ) {
    const config: Partial<GlobalConfig> = {
      positionClass: 'toast-bottom-left',
      timeOut: 4000,
      closeButton: true,
      progressBar: true,
      tapToDismiss: true,
      maxOpened: 1,
      autoDismiss: true,
      toastClass: 'ngx-toastr custom-toast-small'
    };
    this.toastr.toastrConfig = { ...this.toastr.toastrConfig, ...config };
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
            return of();
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

  private handleSessionExpired(): void {
    if (this.isNavigating) return;
    this.isNavigating = true;

    this.userSubject.next(null);
    this.showErrorOnce('Votre session a expiré. Veuillez vous reconnecter.', () => {
      this.router.navigate(['/login']).finally(() => {
        this.isNavigating = false;
      });
    });
  }

  private showErrorOnce(message: string, onClose?: () => void): void {
    if (this.lastMessage === message) return;
    this.lastMessage = message;

    this.toastr.error(message).onHidden.subscribe(() => {
      this.lastMessage = null;
      if (onClose) onClose();
    });
  }
}
