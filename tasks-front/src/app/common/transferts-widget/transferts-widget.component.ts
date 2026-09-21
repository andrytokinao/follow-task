import {Component, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {TransfertFichier, TransfertsService} from '../../services/transferts.service';

/** Laps avant l'effacement automatique, une fois tout envoyé. */
const DELAI_FERMETURE_MS = 2500;

/**
 * Bandeau d'envoi de fichiers, ancré en haut de l'écran.
 *
 * Il est monté dans le shell privé, pas dans l'explorateur : un envoi
 * continue quand on change de page, et son avancement doit rester visible.
 * Replié, il tient sur une ligne ; déplié, il détaille chaque fichier.
 *
 * Il s'efface de lui-même une fois tout terminé sans erreur — un envoi réussi
 * n'a pas à être acquitté. Les échecs, eux, restent affichés.
 */
@Component({
  standalone: false,
  selector: 'app-transferts-widget',
  templateUrl: './transferts-widget.component.html',
  styleUrl: './transferts-widget.component.css'
})
export class TransfertsWidgetComponent implements OnDestroy {

  liste: TransfertFichier[] = [];
  progression = 0;
  deplie = false;

  private readonly destroy$ = new Subject<void>();

  constructor(protected transferts: TransfertsService) {
    this.transferts.transferts$.pipe(takeUntil(this.destroy$)).subscribe(liste => {
      this.liste = liste;
      this.planifierFermeture();
    });
    this.transferts.progressionGlobale$.pipe(takeUntil(this.destroy$))
      .subscribe(valeur => this.progression = valeur);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get restants(): number {
    return this.liste.filter(t => t.etat === 'attente' || t.etat === 'encours').length;
  }

  get enErreur(): number {
    return this.liste.filter(t => t.etat === 'erreur').length;
  }

  get libelle(): string {
    if (this.restants > 0) {
      return this.restants === 1 ? 'Envoi d’un fichier…' : `Envoi de ${this.restants} fichiers…`;
    }
    if (this.enErreur > 0) {
      return this.enErreur === 1 ? '1 envoi a échoué' : `${this.enErreur} envois ont échoué`;
    }
    return 'Envoi terminé';
  }

  /** Tout est passé : on laisse voir le 100 %, puis le bandeau s'efface. */
  private planifierFermeture(): void {
    if (!this.liste.length || !this.liste.every(t => t.etat === 'termine')) {
      return;
    }
    setTimeout(() => {
      if (this.liste.length && this.liste.every(t => t.etat === 'termine')) {
        this.transferts.effacerTermines();
        this.deplie = false;
      }
    }, DELAI_FERMETURE_MS);
  }

  trackById(_index: number, transfert: TransfertFichier): number {
    return transfert.id;
  }
}
