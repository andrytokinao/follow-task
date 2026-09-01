import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

/**
 * Etat de la mise en page du poste de travail, partage entre le cadre
 * (ProjectComponent) et les pages affichees dedans.
 *
 * Le repli de la barre laterale etait un champ prive de ProjectComponent :
 * seule sa fleche pouvait le declencher. En le sortant ici, une page qui a
 * besoin de largeur — le calendrier en premier — peut proposer le meme
 * basculement sans que l'utilisateur remonte chercher la fleche.
 */
@Injectable({providedIn: 'root'})
export class LayoutService {
  /** localStorage et non sessionStorage : une preference d'affichage doit
   *  survivre a la fermeture de l'onglet. */
  private static readonly CLE = 'sidebar-reduite';

  private reduiteSubject = new BehaviorSubject<boolean>(
    localStorage.getItem(LayoutService.CLE) === 'true'
  );
  sidebarReduite$ = this.reduiteSubject.asObservable();

  get sidebarReduite(): boolean {
    return this.reduiteSubject.value;
  }

  basculerSidebar(): void {
    this.definirSidebar(!this.reduiteSubject.value);
  }

  definirSidebar(reduite: boolean): void {
    if (reduite === this.reduiteSubject.value) {
      return;
    }
    this.reduiteSubject.next(reduite);
    localStorage.setItem(LayoutService.CLE, String(reduite));
  }
}
