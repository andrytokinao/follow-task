import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProjectModule} from "./pages/project/project.module";
import {AppRoutingModule} from "./app.routing.module";
import {AppComponent} from "./app.component";
import {HomeComponent} from "./pages/home/home.component";
import {DashboardComponent} from "./pages/dashboard/dashboard.component";
import {BrowserModule} from "@angular/platform-browser";



@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,

  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    ProjectModule,
    BrowserModule
  ],
  bootstrap: [AppComponent]

})
export class AppModule { }
