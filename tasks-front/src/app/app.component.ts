import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter, take} from 'rxjs/operators';
import {routeTransition} from "../route-transition";
import {environment} from "../environments/environment";
import {OtaService} from "./services/ota.service";
import {UpdateService} from "./services/update.service";
import {ChunkErrorHandler} from "./services/chunk-error.handler";

/** Intervalle entre deux verifications de mise a jour native (OTA). */
const INTERVALLE_OTA = 30 * 60 * 1000;

@Component({
  standalone:false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    routeTransition
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'tasks-front';
  pageContent: string = "";
  content: string ="ontenu";
  private minuterieOta?: ReturnType<typeof setInterval>;

  constructor(private otaService:OtaService,
              private updateService:UpdateService,
              private zone: NgZone,
              private router: Router) {
  }
  ngOnInit() {
    // Cache applicatif (web / PWA) : téléchargement silencieux et bascule au
    // prochain changement de page.
    this.updateService.init();

    // 1. Vérification au démarrage de l'app
    this.otaService.checkAndUpdate(environment.appVersion);

    // 2. Vérification périodique toutes les 30 minutes.
    //
    // Hors zone Angular : un interval suivi par zone.js maintient
    // l'application indefiniment "instable". Or le service worker n'est
    // enregistre qu'a la stabilite (registerWhenStable), et UpdateService
    // attend cette meme stabilite avant sa premiere verification de version.
    // Un simple interval ici bloquait donc toute la mise a jour du cache
    // applicatif — la cause des melanges de versions apres deploiement.
    this.zone.runOutsideAngular(() => {
      this.minuterieOta = setInterval(() => {
        this.zone.run(() => this.otaService.checkAndUpdate(environment.appVersion));
      }, INTERVALLE_OTA);
    });

    // Une premiere navigation aboutie prouve que les chunks servis sont
    // coherents : on rearme le rechargement de secours pour la suite.
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      take(1)
    ).subscribe(() => ChunkErrorHandler.marquerDemarrageReussi());
  }

  ngOnDestroy(): void {
    if (this.minuterieOta) {
      clearInterval(this.minuterieOta);
    }
  }
}
