import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from "ngx-toastr";

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {

  constructor(private router: Router,
              private toastr: ToastrService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const responseBody = event.body;
          // Exemple : si backend renvoie un JSON avec result:"error"
          if (responseBody && responseBody.result === 'error') {
            this.toastr.error(responseBody.message || 'Erreur inconnue', 'Erreur');
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.error instanceof ErrorEvent) {
          // Erreur côté client
          this.toastr.error('Client-side error: ' + error.error.message, 'Erreur');
        } else {
          // Erreur backend
          if (error.status === 401) {
            this.toastr.warning('Session expirée, merci de vous reconnecter', 'Non autorisé');
            this.router.navigate(['/login']);
          } else if (error.status === 0) {
            this.toastr.error('Pas de connexion Internet', 'Erreur');
          } else {
            this.toastr.error(error.error?.message || 'Erreur serveur', 'Erreur');
          }
        }
        return throwError(() => error);
      })
    );
  }
}
