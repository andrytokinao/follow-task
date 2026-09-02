import {ErrorHandler, Injectable} from '@angular/core';

/**
 * Rattrape les echecs de chargement des modules differes (lazy chunks).
 *
 * Symptome traite : page blanche apres connexion. La redirection vers
 * /working demande au routeur de charger un chunk ; si le fichier servi
 * n'appartient pas a la meme compilation que le bundle deja en memoire
 * (deploiement pendant que l'onglet etait ouvert, cache du service worker
 * partiellement renouvele), l'import echoue. Le routeur abandonne alors la
 * navigation, le <router-outlet> reste vide, et rien n'est affiche.
 *
 * La seule sortie saine est un rechargement complet, qui repart de l'index et
 * des fichiers courants. Le drapeau en sessionStorage evite la boucle de
 * rechargement quand le probleme vient d'ailleurs (reseau coupe, 404 reel).
 */
@Injectable()
export class ChunkErrorHandler implements ErrorHandler {
  private static readonly CLE_RECHARGEMENT = 'rechargement-apres-chunk-manquant';

  /** Messages emis par les differents navigateurs pour un chunk introuvable. */
  private static readonly SIGNATURES = [
    'ChunkLoadError',
    'Loading chunk',
    'Loading CSS chunk',
    'Failed to fetch dynamically imported module',
    'error loading dynamically imported module',
    'Importing a module script failed',
  ];

  handleError(error: any): void {
    if (this.estChunkManquant(error)) {
      this.rechargerUneFois();
      return;
    }
    console.error(error);
  }

  private estChunkManquant(error: any): boolean {
    const texte = `${error?.name ?? ''} ${error?.message ?? ''} ${error?.rejection?.message ?? ''}`;
    return ChunkErrorHandler.SIGNATURES.some(signature => texte.includes(signature));
  }

  private rechargerUneFois(): void {
    if (sessionStorage.getItem(ChunkErrorHandler.CLE_RECHARGEMENT)) {
      // Deja tente : on laisse l'erreur visible plutot que de boucler.
      console.error('[APP] Chunk introuvable apres rechargement, abandon.');
      return;
    }
    sessionStorage.setItem(ChunkErrorHandler.CLE_RECHARGEMENT, '1');
    console.warn('[APP] Chunk introuvable : rechargement de l application.');
    document.location.reload();
  }

  /**
   * Appele une fois l'application demarree : la version en place est saine,
   * un futur echec a de nouveau droit a son rechargement.
   */
  static marquerDemarrageReussi(): void {
    sessionStorage.removeItem(ChunkErrorHandler.CLE_RECHARGEMENT);
  }
}
