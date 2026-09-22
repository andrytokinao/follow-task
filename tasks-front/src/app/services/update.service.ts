import {ApplicationRef, Injectable} from '@angular/core';
import {SwUpdate, VersionEvent} from '@angular/service-worker';
import {NavigationEnd, Router} from '@angular/router';
import {concat, filter, first, interval} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {recharger} from './trace-rechargement';

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
  /** Cache irrecuperable : rechargement reporte au prochain changement de page. */
  private raisonRechargement?: string;

  constructor(private swUpdate: SwUpdate,
              private appRef: ApplicationRef,
              private router: Router,
              private toastr: ToastrService) {
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
      if (this.raisonRechargement) {
        recharger(this.raisonRechargement, 'changement de page');
        return;
      }
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
    // Fichiers manquants ou corrompus dans le cache : seul un rechargement
    // complet, qui repart du reseau, remet l'application dans un etat sain.
    //
    // Mais pas tout de suite : recharger sur-le-champ faisait perdre la
    // saisie en cours (formulaire d'evenement, au premier choix d'une tache).
    // On attend le prochain changement de page, et l'utilisateur peut
    // recharger lui-meme depuis le message.
    this.swUpdate.unrecoverable.subscribe(event => {
      console.error('[MAJ] Cache irrecuperable :', event.reason);
      if (this.raisonRechargement) {
        return;
      }
      this.raisonRechargement = `Cache irrecuperable : ${event.reason}`;
      this.toastr.warning('Cliquez ici pour recharger quand vous aurez terminé.',
        'Mise à jour nécessaire', {disableTimeOut: true, tapToDismiss: true})
        .onTap.subscribe(() => recharger(this.raisonRechargement!, 'clic sur le message'));
    });
  }

  /** Active la version deja telechargee puis recharge la page. */
  async appliquer(): Promise<void> {
    try {
      if (await this.swUpdate.activateUpdate()) {
        recharger('Nouvelle version activee');
      }
    } catch (err) {
      console.warn('[MAJ] Activation impossible :', err);
    }
  }
}
