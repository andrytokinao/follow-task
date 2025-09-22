import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse, HttpResponse
} from '@angular/common/http';
import {BehaviorSubject, Observable, tap, throwError} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from './auth.service';
import { User } from '../type/issue';

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {
  private userSubject = new BehaviorSubject<User | null>(null);
  connectedUser$ = this.userSubject.asObservable();

  private isNotifying = false;

  constructor(
    private router: Router,
    private toastr: ToastrService,
  //  private authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    req = req.clone({
      withCredentials: true
    });

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          if (this.isLoginPageContent(event.body)) {
            this.handleSessionExpired();
          }
        }
      }),
      catchError((error: any) => {
        if (this.isLoginPage(error.error)) {
          console.log('error',error);
          this.handleSessionExpired();
        }
        else if (error.status === 401) {
          this.handleSessionExpired();
        }
        else {
          if (error.status === 0) {
            this.showErrorOnce('Erreur de connexion au serveur');
          } else {
            this.showErrorOnce(`Erreur HTTP : ${error.status}`);
          }
        }

        return throwError(() => error);
      })
    );
  }
  private isLoginPageContent(body: any): boolean {
    return (
      typeof body === 'string' &&
      body.includes('class="form-signin"')
    );
  }



  private isLoginPage(error: any): boolean {
    return (
      typeof error.text === 'string' &&
      error.text.includes('class="form-signin"')
    );
  }

  private handleSessionExpired(): void {
    this.userSubject.next(null);
    this.showErrorOnce('Session expirée. Veuillez vous reconnecter.', () => {
      this.router.navigate(['/login']);
    });
  }

  private showErrorOnce(message: string, onClose?: () => void): void {
    if (this.isNotifying) return;
    this.isNotifying = true;

    this.toastr.error(message, 'Erreur', {
      timeOut: 5000,
      closeButton: true
    }).onHidden.subscribe(() => {
      this.isNotifying = false;
      if (onClose) onClose();
    });
  }
}
