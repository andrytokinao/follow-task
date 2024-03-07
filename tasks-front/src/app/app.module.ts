import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProjectModule} from "./pages/project/project.module";
import {AppRoutingModule} from "./app.routing.module";
import {AppComponent} from "./app.component";
import {HomeComponent} from "./pages/public/home/home.component";
import {DashboardComponent} from "./pages/dashboard/dashboard.component";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {NgbModal, NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {HttpClientModule} from "@angular/common/http";
import {MatMenuModule} from "@angular/material/menu";
import {GraphQLModule} from "./type/graphql.module";



@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,

  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    ProjectModule,
    BrowserModule,
    BrowserAnimationsModule,
    NgbModule,
    HttpClientModule,
    GraphQLModule,

  ],
  bootstrap: [AppComponent]

})
export class AppModule { }
