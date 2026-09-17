import {Component, EventEmitter, OnDestroy, Output} from '@angular/core';
import {Subject} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';
import {EventApp, Issue} from '../../type/issue';
import {EventsService} from '../../services/events.service';
import {IssueService} from '../../services/issue.service';
import {UserService} from '../../services/user.service';

/**
 * Consultation d'un événement, affichée dans le même menu que le formulaire
 * (EventMenuComponent) : cliquer un créneau montre ce qu'il contient sans
 * masquer le planning, et « Modifier » bascule sur le formulaire au même
 * endroit.
 */
@Component({
  standalone: false,
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css'
})
export class EventDetailComponent implements OnDestroy {

  /** L'hôte ouvre le formulaire d'édition pour cet événement. */
  @Output() modifier = new EventEmitter<EventApp>();
  @Output() onClose = new EventEmitter<void>();

  event?: EventApp;
  loading = false;

  /** Projet (demande) et tâche (sous-tâche) de l'événement, avec leur lien. */
  projet?: Issue;
  tache?: Issue;
  lienProjet: string | null = null;
  lienTache: string | null = null;

  /** Jeton de la dernière demande : une réponse tardive ne doit pas écraser la suivante. */
  private demande = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private eventService: EventsService,
    private issueService: IssueService,
    private userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEvent(id: number | string): void {
    const demande = ++this.demande;
    this.event = undefined;
    this.loading = true;
    this.eventService.getByEventById(id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loading = false))
      .subscribe({
        next: (event) => {
          if (demande !== this.demande) return;
          this.event = event;
          this._resoudreLiens(event);
        },
        error: (err) => { console.error(err); }
      });
  }

  get photoUtilisateur(): string | null {
    return this.event?.user ? this.userService.getUrlPhoto(this.event.user) : null;
  }

  get nomUtilisateur(): string {
    const user = this.event?.user;
    return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  }

  /** « mardi 16 sept. · 10:00 – 11:00 », la date de fin n'est répétée que si elle diffère. */
  get periode(): string {
    if (!this.event?.start) return '';
    const debut = new Date(this.event.start);
    const fin = this.event.end ? new Date(this.event.end) : undefined;
    const jour = (d: Date) => d.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'short'});
    const heure = (d: Date) => d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
    if (!fin || isNaN(fin.getTime())) {
      return `${jour(debut)} · ${heure(debut)}`;
    }
    if (debut.toDateString() === fin.toDateString()) {
      return `${jour(debut)} · ${heure(debut)} – ${heure(fin)}`;
    }
    return `${jour(debut)} ${heure(debut)} – ${jour(fin)} ${heure(fin)}`;
  }

  editer(): void {
    if (this.event) this.modifier.emit(this.event);
  }

  fermer(): void {
    this.onClose.emit();
  }

  /**
   * Le projet de l'événement est porté par l'événement, pas par l'issue que
   * renvoie la requête : on le lui rattache pour que l'URL désigne le bon
   * projet, et reste non cliquable s'il n'est pas le projet ouvert.
   */
  private _resoudreLiens(event: EventApp): void {
    const issue = event.issue ? {...event.issue, project: event.issue.project ?? event.project} : undefined;
    if (issue?.parent) {
      this.projet = {...issue.parent, project: issue.project};
      this.tache = issue;
    } else {
      this.projet = issue;
      this.tache = undefined;
    }
    this.lienProjet = this.issueService.getIssueUrl(this.projet);
    this.lienTache = this.issueService.getIssueUrl(this.tache);
  }
}
