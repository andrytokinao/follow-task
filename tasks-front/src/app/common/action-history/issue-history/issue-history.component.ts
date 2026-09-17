import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { ActionHistorique } from '../../../type/issue';
import { ActionService } from '../../../services/action.service';
import { IssueService } from '../../../services/issue.service';
import { ActionItemComponent } from '../action-item/action-item.component';

interface JourHistorique {
  cle: string;
  libelle: string;
  actions: ActionHistorique[];
}

/**
 * Historique des modifications d'une issue, regroupé par jour, les plus
 * récentes en haut. Chaque ligne est confiée à app-action-item.
 */
@Component({
  selector: 'app-issue-history',
  standalone: true,
  imports: [CommonModule, ActionItemComponent],
  templateUrl: './issue-history.component.html',
  styleUrl: './issue-history.component.scss'
})
export class IssueHistoryComponent implements OnInit, OnChanges, OnDestroy {
  @Input() issueId: number | null | undefined;

  jours: JourHistorique[] = [];
  chargement = false;
  erreur = false;

  private requete?: Subscription;
  private actionsSubscription?: Subscription;

  constructor(private actionService: ActionService, private issueService: IssueService) {}

  ngOnInit(): void {
    // Statut ou assignation changés sur cette tâche, ici ou depuis un autre
    // poste : la ligne apparaît sans rouvrir l'onglet.
    this.actionsSubscription = this.issueService.actionTraitee$
      .pipe(filter(id => this.issueId != null && id === Number(this.issueId)))
      .subscribe(() => this.charger(false));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['issueId']) this.charger();
  }

  ngOnDestroy(): void {
    this.requete?.unsubscribe();
    this.actionsSubscription?.unsubscribe();
  }

  /** @param squelette faux pour un rafraîchissement : on garde la liste affichée pendant la requête. */
  charger(squelette = true): void {
    this.requete?.unsubscribe();
    this.erreur = false;
    if (this.issueId == null) {
      this.jours = [];
      return;
    }
    if (squelette) {
      this.jours = [];
      this.chargement = true;
    }
    this.requete = this.actionService.getIssueHistory(Number(this.issueId)).subscribe({
      next: actions => {
        this.jours = this.grouperParJour(actions);
        this.chargement = false;
      },
      error: () => {
        this.erreur = true;
        this.chargement = false;
      }
    });
  }

  trackByJour = (_: number, jour: JourHistorique) => jour.cle;
  trackByAction = (_: number, action: ActionHistorique) => action.id;

  /** Le serveur trie déjà ; on ne fait que couper aux changements de jour. */
  private grouperParJour(actions: ActionHistorique[]): JourHistorique[] {
    const jours: JourHistorique[] = [];
    for (const action of actions) {
      const date = action.date ? new Date(action.date) : null;
      const cle = date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : 'sans-date';
      let jour = jours[jours.length - 1];
      if (!jour || jour.cle !== cle) {
        jour = { cle, libelle: this.libelleJour(date), actions: [] };
        jours.push(jour);
      }
      jour.actions.push(action);
    }
    return jours;
  }

  private libelleJour(date: Date | null): string {
    if (!date) return 'Date inconnue';
    const jour = new Date(date);
    jour.setHours(0, 0, 0, 0);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const ecart = Math.round((aujourdhui.getTime() - jour.getTime()) / 86400000);
    if (ecart === 0) return 'Aujourd\'hui';
    if (ecart === 1) return 'Hier';
    return jour.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
      year: jour.getFullYear() === aujourdhui.getFullYear() ? undefined : 'numeric'
    });
  }
}
