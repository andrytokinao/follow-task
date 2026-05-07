import { CUSTOM_ELEMENTS_SCHEMA, NgModule, isDevMode} from '@angular/core';
import { CommonModule } from '@angular/common';
import {appRoutes, AppRoutingModule} from "./app.routing.module";
import {AppComponent} from "./app.component";
import {BrowserAnimationsModule, provideAnimations} from '@angular/platform-browser/animations';
import { provideNativeDateAdapter} from '@angular/material/core';
import {FormsModule, } from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClientModule,} from '@angular/common/http';

import {CookieService} from "ngx-cookie-service";
import {HttpInterceptorService} from "./services/http.service";
import {provideToastr, ToastrModule} from "ngx-toastr";
import {MarkdownModule} from "ngx-markdown";
import {QuillModule} from "ngx-quill";
import {provideRouter} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {GraphQLModule} from "./type/graphql.module";
import {ProjectModule} from "./pages/private/project/project.module";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import { ServiceWorkerModule } from '@angular/service-worker';


@NgModule({
  declarations: [
    AppComponent,
  ],
    imports: [
      CommonModule,
      AppRoutingModule,
      ProjectModule,
      BrowserAnimationsModule,
      NgbModule,
      HttpClientModule,
      GraphQLModule,

        ToastrModule.forRoot({
            positionClass: 'custom-toast-position',
            preventDuplicates: true,
            timeOut: 10000,
            closeButton: true,
            progressBar: true
        }),
        MarkdownModule.forRoot(),
        QuillModule.forRoot({
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'], // Outils de style
                    [{header: [1, 2, 3, false]}], // En-têtes
                    [{list: 'ordered'}, {list: 'bullet'}], // Listes
                    ['link', 'image'], // Liens et images
                ],
            },
        }),
      BrowserModule,
      HttpClientModule,
      GraphQLModule,
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000'
      }),


    ],

  bootstrap: [AppComponent],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  providers :[
    CookieService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true
    },
    provideAnimations(), // required animations providers
    provideToastr(), // Toastr providers
    provideNativeDateAdapter(),
    provideRouter(appRoutes),
  ],



})
export class AppModule { }
