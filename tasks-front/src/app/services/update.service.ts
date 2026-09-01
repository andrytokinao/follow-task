import {ApplicationRef, Injectable} from '@angular/core';
import {SwUpdate, VersionEvent} from '@angular/service-worker';
import {NavigationEnd, Router} from '@angular/router';
import {concat, filter, first, interval} from 'rxjs';

/** Intervalle entre deux verifications de version. */
const INTERVALLE_VERIFICATION = 30 * 60 * 1000;

/**
 * Mise a jour du cache applicatif (service worker).
 *
 * Le principe : telecharger en silence, n'interrompre personne. Le service
 * worker recupere les nouveaux fichiers en tache de fond ; la bascule vers la
 * nouvelle version n'a lieu qu'au prochain changement de page, la ou perdre
 * l'etat de l'ecran courant est sans consequence.
 */
@Injectable({providedIn: 'root'})
export class UpdateService {
  /** Une version est telechargee et attend un moment opportun pour s'activer. */
  private versionPrete = false;

  constructor(private swUpdate: SwUpdate,
              private appRef: ApplicationRef,
              private router: Router) {
  }

  init(): void {
    // Desactive en developpement (enabled: !isDevMode dans app.module).
    if (!this.swUpdate.isEnabled) {
      return;
    }
    this.surveillerVersions();
    this.appliquerAuChangementDePage();
    this.verifierPeriodiquement();
    this.reagirAuCacheCorrompu();
  }

  private surveillerVersions(): void {
    this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
      switch (event.type) {
        case 'VERSION_DETECTED':
          // Rien a faire : le service worker telecharge deja en arriere-plan.
          console.info('[MAJ] Telechargement de la version', event.version.hash);
          break;
        case 'VERSION_READY':
          console.info('[MAJ] Version prete :', event.latestVersion.hash);
          this.versionPrete = true;
          break;
        case 'VERSION_INSTALLATION_FAILED':
          // Echec silencieux : l'application continue sur la version en place.
          console.warn('[MAJ] Installation echouee :', event.error);
          break;
      }
    });
  }

  private appliquerAuChangementDePage(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (!this.versionPrete) {
        return;
      }
      // Remis a false avant l'activation : la navigation suivante ne doit pas
      // declencher un second rechargement.
      this.versionPrete = false;
      this.appliquer();
    });
  }

  private verifierPeriodiquement(): void {
    // On attend la stabilite de l'application avant de lancer le timer : un
    // interval demarre trop tot maintient Angular indefiniment "instable", et
    // le service worker ne se declare alors jamais pret.
    const stable = this.appRef.isStable.pipe(first(estStable => estStable));
    concat(stable, interval(INTERVALLE_VERIFICATION)).subscribe(() => {
      this.swUpdate.checkForUpdate()
        .catch(err => console.warn('[MAJ] Verification impossible :', err));
    });
  }

  private reagirAuCacheCorrompu(): void {
    // Fichiers manquants ou corrompus dans le cache : l'application ne peut
    // plus charger ses morceaux differes. Seul un rechargement complet, qui
    // repart du reseau, la remet dans un etat sain.
    this.swUpdate.unrecoverable.subscribe(event => {
      console.error('[MAJ] Cache irrecuperable :', event.reason);
      document.location.reload();
    });
  }

  /** Active la version deja telechargee puis recharge la page. */
  async appliquer(): Promise<void> {
    try {
      if (await this.swUpdate.activateUpdate()) {
        document.location.reload();
      }
    } catch (err) {
      console.warn('[MAJ] Activation impossible :', err);
    }
  }
}
