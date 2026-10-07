import {Component, Input, OnInit} from '@angular/core';
import {User} from '../../../../type/issue';
import {issueAssignees} from '../../../../type/issue-grouping.util';
import {UserService} from '../../../../services/user.service';
import {DirectionService} from '../direction.service';
import {DetailProjet, ProjetDirection, TacheProjet, TempsPersonne} from '../direction.model';

/** Une personne sur une tâche : assignée, avec le temps qu'elle y a passé. */
interface IntervenantTache {
  user: User;
  minutes: number | null;
}

/**
 * Tâches d'un projet, en lecture seule : avancement, personnes et temps de
 * chacune, temps passé, date de premier traitement.
 *
 * Chargé au premier dépliage de la ligne du projet.
 */
@Component({
  standalone: false,
  selector: 'app-direction-projet-detail',
  templateUrl: './direction-projet-detail.component.html',
  styleUrls: ['./direction-projet-detail.component.css']
})
export class DirectionProjetDetailComponent implements OnInit {

  @Input({required: true}) projet!: ProjetDirection;

  detail: DetailProjet | null = null;
  /** Calculé une fois au chargement : le template le relit à chaque cycle. */
  intervenantsParTache = new Map<unknown, IntervenantTache[]>();
  chargement = true;
  erreur = false;

  constructor(private directionService: DirectionService,
              private userService: UserService) {
  }

  ngOnInit(): void {
    this.directionService.detailProjet(this.projet.id).subscribe({
      next: detail => {
        this.detail = detail;
        this.intervenantsParTache = new Map(detail.taches.map(t => [t.id, this.intervenants(t)]));
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

  // ---------------------------------------------------------------- tâches

  /**
   * Personnes d'une tâche : les assignés (règle commune issueAssignees), puis
   * celles qui y ont du temps sans être assignées. Chacune avec ses heures.
   */
  private intervenants(tache: TacheProjet): IntervenantTache[] {
    const temps: TempsPersonne[] = this.detail?.tempsParTache.get(Number(tache.id)) ?? [];
    const minutesDe = (user: User) =>
      temps.find(t => String(t.user?.id) === String(user.id))?.spentMinutes ?? null;

    const resultat: IntervenantTache[] = issueAssignees(tache)
      .map(user => ({user, minutes: minutesDe(user)}));
    for (const t of temps) {
      if (t.user && !resultat.some(i => String(i.user.id) === String(t.user.id))) {
        resultat.push({user: t.user, minutes: t.spentMinutes});
      }
    }
    return resultat;
  }

  avancement(tache: TacheProjet): number {
    return Math.max(0, Math.min(100, tache.currentCompletionPercent ?? 0));
  }

  classeAvancement(tache: TacheProjet): string {
    const p = this.avancement(tache);
    return p >= 100 ? 'termine' : p >= 70 ? 'haut' : p >= 30 ? 'moyen' : 'bas';
  }

  // ---------------------------------------------------------------- affichage

  nomDe(user: User | null | undefined): string {
    const nom = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return nom || (user?.username as string) || '';
  }

  photoDe(user: User): string {
    return this.userService.getUrlPhoto(user);
  }

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
