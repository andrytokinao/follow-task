import {Component, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {routeTransition} from "../route-transition";
import {environment} from "../environments/environment";
import {OtaService} from "./services/ota.service";
import {interval} from "rxjs";

@Component({
  standalone:false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    routeTransition
  ]
})
export class AppComponent implements OnInit{
  title = 'tasks-front';
  pageContent: string = "";
  content: string ="ontenu";
  constructor(private otaService:OtaService) {
  }
  ngOnInit() {
    // 1. Vérification au démarrage de l'app
    this.otaService.checkAndUpdate(environment.appVersion);

    // 2. Vérification périodique toutes les 30 minutes
    interval(30 * 60 * 1000).subscribe(() => {
      this.otaService.checkAndUpdate(environment.appVersion);
    });
  }
}
