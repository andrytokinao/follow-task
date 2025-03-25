import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {AppModule} from "./app/app.module";

(window as any).global = window;
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
