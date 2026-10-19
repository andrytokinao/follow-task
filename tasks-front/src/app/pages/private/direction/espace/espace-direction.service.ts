import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {distinctUntilChanged, filter, map, shareReplay, tap} from 'rxjs/operators';
import {DirectionService} from '../direction.service';
import {EspaceDirection} from '../direction.model';

/**
 * Espace de travail affiché par le cockpit de direction : celui de l'adresse
 * (`/direction/TOPO/...`), aucun sur l'accueil (`/direction`). Les pages d'un
 * espace s'abonnent à `espace$` et se rechargent quand il change.
 */
@Injectable({providedIn: 'root'})
export class EspaceDirectionService {

  /** localStorage : revenir sur /direction rouvre le dernier espace consulté. */
  private static readonly CLE = 'direction-espace';

  private espaces$?: Observable<EspaceDirection[]>;
  private readonly courantSubject = new BehaviorSubject<EspaceDirection | null>(null);

  /** Espace du menu ; null sur l'accueil, qui couvre tous les espaces. */
  readonly courant$: Observable<EspaceDirection | null> = this.courantSubject.asObservable();

  /** Espace courant des pages d'espace ; n'émet qu'une fois l'adresse résolue, et à chaque changement. */
  readonly espace$: Observable<EspaceDirection> = this.courantSubject.pipe(
    filter((espace): espace is EspaceDirection => espace != null),
    distinctUntilChanged((a, b) => a.prefixe === b.prefixe));

  constructor(private directionService: DirectionService) {
  }

  /** Espaces de travail, demandés une fois par session ; un échec sera retenté. */
  espaces(): Observable<EspaceDirection[]> {
    if (!this.espaces$) {
      this.espaces$ = this.directionService.espaces().pipe(
        tap({error: () => this.espaces$ = undefined}),
        shareReplay(1));
    }
    return this.espaces$;
  }

  get courant(): EspaceDirection | null {
    return this.courantSubject.value;
  }

  /** Espace de ce préfixe, sans tenir compte de la casse ; null s'il n'existe pas. */
  trouver(prefixe: string | null | undefined): Observable<EspaceDirection | null> {
    if (!prefixe) {
      return of(null);
    }
    const cherche = prefixe.toLowerCase();
    return this.espaces().pipe(map(espaces => espaces.find(e => e.prefixe.toLowerCase() === cherche) ?? null));
  }

  /** Espace à ouvrir sans précision : le dernier consulté, à défaut le premier. */
  parDefaut(): Observable<EspaceDirection | null> {
    const dernier = localStorage.getItem(EspaceDirectionService.CLE)?.toLowerCase();
    return this.espaces().pipe(map(espaces =>
      espaces.find(e => e.prefixe.toLowerCase() === dernier) ?? espaces[0] ?? null));
  }

  activer(espace: EspaceDirection): void {
    localStorage.setItem(EspaceDirectionService.CLE, espace.prefixe);
    this.courantSubject.next(espace);
  }

  /** Retour à l'accueil : plus d'espace courant, le dernier reste mémorisé. */
  quitter(): void {
    this.courantSubject.next(null);
  }
}
