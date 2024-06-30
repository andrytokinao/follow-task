import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    req = req.clone({
      withCredentials: true
    });
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const responseBody = event.body;
          if (typeof responseBody === 'string' && responseBody.includes('<form') && responseBody.includes('id="login-form"')) {
            this.router.navigate(['/login']);
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Intercepted error ');
        if (error.error.text &&  error.error.text.includes('class="form-signin"')) {
             this.router.navigate(['/login']);
        }

        return throwError(error);
      })
    );
  }
}
