import {Injectable} from '@angular/core';

/**
 * Memorise la page quittee lors d'une expiration de session, pour y revenir
 * apres reconnexion.
 *
 * sessionStorage plutot qu'un champ d'instance : la reconnexion peut passer
 * par un rechargement complet de l'application, qui viderait un etat garde en
 * memoire. sessionStorage est aussi propre a l'onglet, donc deux onglets sur
 * deux pages differentes ne se volent pas leur destination.
 */
@Injectable({providedIn: 'root'})
export class RedirectionService {
  private static readonly CLE = 'redirection-apres-login';
  /** Pages publiques : y revenir apres connexion n'aurait pas de sens. */
  private static readonly ROUTES_IGNOREES = ['/', '/login', '/help'];

  memoriser(url: string): void {
    if (!url) {
      return;
    }
    const chemin = url.split('?')[0].split('#')[0];
    if (RedirectionService.ROUTES_IGNOREES.includes(chemin)) {
      return;
    }
    sessionStorage.setItem(RedirectionService.CLE, url);
  }

  /** Retourne l'url memorisee et l'oublie : elle ne doit servir qu'une fois. */
  consommer(): string | null {
    const url = sessionStorage.getItem(RedirectionService.CLE);
    sessionStorage.removeItem(RedirectionService.CLE);
    return url;
  }

  oublier(): void {
    sessionStorage.removeItem(RedirectionService.CLE);
  }
}
