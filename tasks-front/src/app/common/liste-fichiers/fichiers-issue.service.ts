import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {finalize, map, shareReplay, tap} from 'rxjs/operators';
import {IssueService} from '../../services/issue.service';
import {Repertoire} from '../../type/issue';
import {aplatir, FichierIssue} from './fichiers-issue';

/** Fichiers d'une issue, tels que le serveur les a rendus à un instant. */
export interface FichiersCharges {
  racine: Repertoire;
  fichiers: FichierIssue[];
  /** Heure de la réponse : la liste dit de quand elle date. */
  recuLe: number;
}

/**
 * Fichiers d'une issue (`api/load-directory`, toute l'arborescence), gardés en
 * mémoire par issue le temps de la session : revenir sur une issue les montre
 * aussitôt, sans reparcourir son dossier sur le serveur. « Rafraîchir » et un
 * envoi les redemandent. Deux demandes simultanées partagent la même requête.
 */
@Injectable({providedIn: 'root'})
export class FichiersIssueService {

  private readonly caches = new Map<number, FichiersCharges>();
  private readonly enCours = new Map<number, Observable<FichiersCharges>>();

  constructor(private readonly issueService: IssueService) {
  }

  /** Déjà en mémoire, sans requête. */
  enCache(issueId: number): FichiersCharges | undefined {
    return this.caches.get(issueId);
  }

  /** Les fichiers de l'issue : ceux en mémoire, sinon demandés ; `forcer` les redemande. */
  charger(issueId: number, forcer = false): Observable<FichiersCharges> {
    const connus = this.caches.get(issueId);
    if (connus && !forcer) {
      return of(connus);
    }
    let requete = this.enCours.get(issueId);
    if (!requete) {
      requete = this.issueService.loadDirectory(issueId).pipe(
        map(racine => ({racine, fichiers: aplatir(racine), recuLe: Date.now()})),
        tap(charges => this.caches.set(issueId, charges)),
        finalize(() => this.enCours.delete(issueId)),
        shareReplay(1));
      this.enCours.set(issueId, requete);
    }
    return requete;
  }

  /** Une écriture (envoi, suppression) ailleurs : la prochaine lecture redemandera. */
  oublier(issueId: number): void {
    this.caches.delete(issueId);
  }
}
