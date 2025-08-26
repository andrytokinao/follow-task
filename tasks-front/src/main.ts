import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {AppModule} from "./app/app.module";

(window as any).global = window;
platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => {
    const loader = document.getElementById('global-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 300);
    }
  })
  .catch(err => console.error(err));
