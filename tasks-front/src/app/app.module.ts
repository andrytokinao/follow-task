import { CUSTOM_ELEMENTS_SCHEMA, NgModule, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { appRoutes, AppRoutingModule } from "./app.routing.module";
import { AppComponent } from "./app.component";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { provideRouter, TitleStrategy } from "@angular/router";
import { AppTitleStrategy } from "./services/app-title.strategy";

import { CookieService } from "ngx-cookie-service";
import { HttpInterceptorService } from "./services/http.service";
import { ToastrModule } from "ngx-toastr";
import { MarkdownModule } from "ngx-markdown";
import { QuillModule } from "ngx-quill";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { ServiceWorkerModule } from '@angular/service-worker';

import { GraphQLModule } from "./type/graphql.module";
import { ProjectModule } from "./pages/private/project/project.module";
import {OverlayModule} from "@angular/cdk/overlay";

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    ProjectModule,
    NgbModule,
    GraphQLModule,
    OverlayModule,

    ToastrModule.forRoot({
      positionClass: 'custom-toast-position',
      preventDuplicates: true,
      // 10 s, c'était long pour une confirmation ; 5 s suffisent, et le toast
      // reste affiché tant que la souris est dessus (extendedTimeOut).
      timeOut: 5000,
      extendedTimeOut: 2000,
      closeButton: true,
      progressBar: true,
      progressAnimation: 'decreasing',
      newestOnTop: true,
      // Au-delà, la pile masque l'interface — surtout sur mobile.
      maxOpened: 4,
      autoDismiss: true,
      tapToDismiss: true,
      easeTime: 200,
    }),
    MarkdownModule.forRoot(),
    QuillModule.forRoot({
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ header: [1, 2, 3, false] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
        ],
      },
    }),

    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],

  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    CookieService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true
    },
    provideAnimations(),
    provideNativeDateAdapter(),
    provideRouter(appRoutes),
    // Déclaré après les imports : ce provider remplace le DefaultTitleStrategy
    // fourni par RouterModule.forRoot().
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
})
export class AppModule { }
