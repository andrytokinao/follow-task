import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { User } from '../type/issue';

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {
  private userSubject = new BehaviorSubject<User | null>(null);
  connectedUser$ = this.userSubject.asObservable();

  private lastMessage: string | null = null;

  constructor(
    private router: Router,
    private toastr: ToastrService
  ) {}

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
        if (this.isLoginPage(error.error) || error.status === 401) {
          this.handleSessionExpired();
        } else {
          const msg = error.status === 0 ? 'Erreur de connexion au serveur' : `Erreur HTTP : ${error.status}`;
          this.showErrorOnce(msg);
        }
        return throwError(() => error);
      })
    );
  }

  private isLoginPageContent(body: any): boolean {
    return typeof body === 'string' && body.includes('class="form-signin"');
  }

  private isLoginPage(error: any): boolean {
    return typeof error.text === 'string' && error.text.includes('class="form-signin"');
  }

  private handleSessionExpired(): void {
    this.userSubject.next(null);
    this.showErrorOnce('Session expirée. Veuillez vous reconnecter.', () => {
      this.router.navigate(['/login']);
    });
  }

  private showErrorOnce(message: string, onClose?: () => void): void {
    if (this.lastMessage === message) return;
    this.lastMessage = message;

    this.toastr.error(message, 'Erreur', {
      timeOut: 5000,
      closeButton: true
    }).onHidden.subscribe(() => {
      this.lastMessage = null;
      if (onClose) onClose();
    });
  }
}
