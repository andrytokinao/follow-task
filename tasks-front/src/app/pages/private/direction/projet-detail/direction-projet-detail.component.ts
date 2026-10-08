import {Component, Input, OnChanges} from '@angular/core';
import {Subscription} from 'rxjs';
import {DirectionService} from '../direction.service';
import {DetailProjet, ProjetDirection, TacheProjet} from '../direction.model';

/**
 * Tâches d'un projet : avancement, assignés (composant commun
 * `app-assign-field`), temps passé, date de premier traitement.
 *
 * Chaque tâche a deux boutons, chacun avec son nombre, ouvrant un mat-menu
 * qui affiche directement ses commentaires ou ses pièces jointes. Rechargé à
 * chaque changement de projet.
 */
@Component({
  standalone: false,
  selector: 'app-direction-projet-detail',
  templateUrl: './direction-projet-detail.component.html',
  styleUrls: ['./direction-projet-detail.component.css']
})
export class DirectionProjetDetailComponent implements OnChanges {

  @Input({required: true}) projet!: ProjetDirection;

  detail: DetailProjet | null = null;
  chargement = true;
  erreur = false;
  private abonnement?: Subscription;

  constructor(private directionService: DirectionService) {
  }

  /** Rechargé à chaque changement d'élément choisi dans le menu. */
  ngOnChanges(): void {
    this.abonnement?.unsubscribe();
    this.detail = null;
    this.chargement = true;
    this.erreur = false;
    this.abonnement = this.directionService.detailProjet(this.projet.id).subscribe({
      next: detail => {
        this.detail = detail;
        this.chargement = false;
      },
      error: () => {
        this.chargement = false;
        this.erreur = true;
      }
    });
  }

  // ---------------------------------------------------------------- liens

  /** Adresse du projet dans son espace de travail. */
  get lienProjet(): string[] | null {
    return this.projet.prefixeDepartement
      ? ['/working', this.projet.prefixeDepartement, 'issue', this.projet.cle]
      : null;
  }

  lienTache(tache: TacheProjet): string[] | null {
    const projet = this.lienProjet;
    return projet && tache.issueKey ? [...projet, 'subtask', tache.issueKey as string] : null;
  }

  // ---------------------------------------------------------------- menus

  /**
   * Les touches restent au contenu du menu (saisie d'un commentaire, flèches),
   * sauf Échap, laissée au mat-menu pour qu'il se ferme.
   */
  garderTouche(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      event.stopPropagation();
    }
  }

  /** Le compteur du bouton suit les ajouts faits dans le menu. */
  commentaireAjoute(tache: TacheProjet): void {
    tache.nombreCommentaires = (tache.nombreCommentaires ?? 0) + 1;
  }

  avancement(tache: TacheProjet): number {
    return Math.max(0, Math.min(100, tache.currentCompletionPercent ?? 0));
  }

  classeAvancement(tache: TacheProjet): string {
    const p = this.avancement(tache);
    return p >= 100 ? 'termine' : p >= 70 ? 'haut' : p >= 30 ? 'moyen' : 'bas';
  }

  // ---------------------------------------------------------------- affichage

  /** Durée en « 4 h 30 », lisible d'un coup d'œil. */
  duree(minutes: number | null | undefined): string {
    const total = Math.max(0, Math.round(minutes ?? 0));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (!h) {
      return `${m} min`;
    }
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  }

  parId(_: number, element: { id?: unknown }): unknown {
    return element?.id;
  }
}
