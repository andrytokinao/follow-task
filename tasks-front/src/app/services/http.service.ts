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
import {ToastrService} from "ngx-toastr";

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {

  constructor(private router: Router,
              private toastr: ToastrService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
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
        if (error.error instanceof ErrorEvent) {
          console.error('Client-side error:', error.error.message);
          this.toastr.error('Client-side error: ' + error.error.message, 'Error');
          if (!navigator.onLine) {
            console.error('No Internet connection');
            this.toastr.error('No Internet connection', 'Error');
         //   this.router.navigate(['/no-internet']);
          }
        } else {
          console.error(`Backend returned code ${error.status}, body was: ${error.message}`);
          if (error.status == 0) {
            console.error('No Internet connection');
            this.toastr.error('No Internet connection', 'Error');
      //           this.router.navigate(['/no-internet']);
          } else if (error.error  && error.error.text.includes('<form') && error.error.text.includes('class="form-signin"')) {
            this.router.navigate(['/login']);
          }
        }
        return throwError(error);
      })
    );
  }
}
