import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProjectModule} from "./pages/private/project/project.module";
import {AppRoutingModule} from "./app.routing.module";
import {AppComponent} from "./app.component";
import {NgbModal, NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {MatMenuModule} from "@angular/material/menu";
import {GraphQLModule} from "./type/graphql.module";
import {BrowserAnimationsModule, provideAnimations} from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {CookieService} from "ngx-cookie-service";
import {HttpInterceptorService} from "./services/http.service";
import {provideToastr, ToastrModule} from "ngx-toastr";


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
    MatToolbarModule,
    AppRoutingModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    MatMenuModule,
    ToastrModule.forRoot({
      positionClass: 'custom-toast-position', // Classe personnalisée pour le toast
      preventDuplicates: true,
      timeOut: 10000, // Temps d'affichage du toast
      closeButton: true, // Afficher le bouton de fermeture
      progressBar: true // Afficher la barre de progression
    })

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
  ]


})
export class AppModule { }
