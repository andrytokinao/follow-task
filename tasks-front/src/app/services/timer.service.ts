import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {MatDialog} from '@angular/material/dialog';
import {
  TimerEndAnswer,
  TimerEndDialogComponent,
} from '../common/timer-end-dialog/timer-end-dialog.component';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerState {
  status: TimerStatus;
  /** Durée choisie, en secondes. */
  durationSeconds: number;
  /** Temps restant, en secondes. */
  remainingSeconds: number;
  /** Part écoulée, de 0 à 100 — pour l'anneau de progression. */
  progressPercent: number;
}

/**
 * Minuteur à rebours de l'espace de travail.
 *
 * L'état vit ici, et non dans le composant : la pastille est détruite et
 * recréée à chaque navigation, alors que le décompte, lui, doit continuer.
 *
 * Le temps restant est recalculé à partir d'un instant de fin absolu plutôt
 * que décrémenté à chaque tick. Les navigateurs brident les timers des onglets
 * en arrière-plan : un compteur décrémenté prendrait du retard, un instant de
 * fin reste juste.
 */
@Injectable({providedIn: 'root'})
export class TimerService implements OnDestroy {

  /** Durées proposées en un clic, en minutes. */
  static readonly PRESETS_MINUTES = [5, 15, 25, 45];

  private static readonly DEFAULT_MINUTES = 25;
  private static readonly STORAGE_KEY = 'paikady.timer';
  private static readonly ALERT_SOUND = 'assets/sounds/alert.mp3';

  private durationSeconds = TimerService.DEFAULT_MINUTES * 60;

  /** Instant de fin (epoch ms). Renseigné uniquement pendant le décompte. */
  private endsAt: number | null = null;

  /** Reste à courir (ms), mémorisé pendant une pause. */
  private pausedRemainingMs: number | null = null;

  private status: TimerStatus = 'idle';

  /** Le tick n'existe que pendant le décompte : à l'arrêt, coût nul. */
  private ticker?: ReturnType<typeof setInterval>;

  /** Garde-fou : une seule question de fin à l'écran à la fois. */
  private endDialogOpen = false;

  private readonly stateSubject = new BehaviorSubject<TimerState>({
    status: 'idle',
    durationSeconds: TimerService.DEFAULT_MINUTES * 60,
    remainingSeconds: TimerService.DEFAULT_MINUTES * 60,
    progressPercent: 0,
  });

  readonly state$: Observable<TimerState> = this.stateSubject.asObservable();

  constructor(
    private readonly toastr: ToastrService,
    private readonly dialog: MatDialog,
  ) {
    // Les initialiseurs de champs ont déjà posé l'état par défaut ; on le
    // remplace par la session éventuellement retrouvée en stockage local.
    this.restore();
    this.publish();

    // Une session restaurée qui tournait encore doit reprendre son tick.
    if (this.status === 'running') {
      this.startTicking();
    }

    // Le minuteur a pu arriver à échéance onglet fermé : la question n'a alors
    // jamais été posée. On la pose au retour, une fois l'amorçage terminé —
    // ouvrir un dialogue depuis un constructeur de service est trop tôt.
    if (this.status === 'finished') {
      setTimeout(() => this.askOutcome());
    }
  }

  // -------------------------------------------------------------------------
  // Commandes
  // -------------------------------------------------------------------------

  /** Choisit une durée. Sans effet pendant un décompte, pour ne pas le fausser. */
  setDurationMinutes(minutes: number): void {
    if (this.status === 'running') {
      return;
    }
    this.durationSeconds = Math.max(1, Math.round(minutes * 60));
    this.pausedRemainingMs = null;
    this.status = 'idle';
    this.publish();
  }

  start(): void {
    if (this.status === 'running') {
      return;
    }

    const remainingMs = this.pausedRemainingMs ?? this.durationSeconds * 1000;
    this.endsAt = Date.now() + remainingMs;
    this.pausedRemainingMs = null;
    this.status = 'running';

    this.startTicking();
    this.publish();
  }

  pause(): void {
    if (this.status !== 'running' || this.endsAt === null) {
      return;
    }
    this.pausedRemainingMs = Math.max(0, this.endsAt - Date.now());
    this.endsAt = null;
    this.status = 'paused';

    this.stopTicking();
    this.publish();
  }

  /** Remet la durée choisie et arrête tout. */
  reset(): void {
    this.endsAt = null;
    this.pausedRemainingMs = null;
    this.status = 'idle';

    this.stopTicking();
    this.publish();
  }

  toggle(): void {
    this.status === 'running' ? this.pause() : this.start();
  }

  // -------------------------------------------------------------------------
  // Décompte
  // -------------------------------------------------------------------------

  private startTicking(): void {
    this.stopTicking();
    // Une seconde : c'est la granularité affichée. Un intervalle plus court
    // ferait tourner la détection de changements sans rien changer à l'écran.
    this.ticker = setInterval(() => this.tick(), 1000);
  }

  private stopTicking(): void {
    if (this.ticker !== undefined) {
      clearInterval(this.ticker);
      this.ticker = undefined;
    }
  }

  private tick(): void {
    if (this.status !== 'running') {
      return;
    }
    if (this.remainingMs() <= 0) {
      this.finish();
      return;
    }
    this.publish();
  }

  private finish(): void {
    this.endsAt = null;
    this.pausedRemainingMs = null;
    this.status = 'finished';

    this.stopTicking();
    this.publish();

    this.notifyEnd();
    this.askOutcome();
  }

  private notifyEnd(): void {
    this.toastr.info('Le temps est écoulé.', 'Minuteur');

    // La lecture audio peut être refusée par le navigateur (onglet muet,
    // politique d'autoplay) : l'alerte visuelle reste, on n'insiste pas.
    try {
      void new Audio(TimerService.ALERT_SOUND).play().catch(() => undefined);
    } catch {
      // Environnement sans Audio : rien à signaler.
    }
  }

  // -------------------------------------------------------------------------
  // Question de fin de session
  // -------------------------------------------------------------------------

  /**
   * Demande où en est la tâche : c'est bon, bloqué, ou besoin de rallonge.
   *
   * Posée automatiquement à 00:00, et de nouveau si l'utilisateur clique la
   * pastille restée en « temps écoulé ». Sans réponse, on retombe simplement
   * au repos : une question fermée ne doit pas revenir hanter la navigation.
   */
  askOutcome(): void {
    if (this.endDialogOpen || this.status !== 'finished') {
      return;
    }
    this.endDialogOpen = true;

    this.dialog
      .open(TimerEndDialogComponent, {
        data: {durationSeconds: this.durationSeconds},
        width: 'auto',
        panelClass: 'timer-end-dialog-panel',
        autoFocus: false,
        restoreFocus: false,
      })
      .afterClosed()
      .subscribe((answer?: TimerEndAnswer) => {
        this.endDialogOpen = false;
        this.applyAnswer(answer);
      });
  }

  private applyAnswer(answer?: TimerEndAnswer): void {
    switch (answer?.kind) {
      case 'done':
        this.reset();
        this.toastr.success('Tâche terminée. Bien joué.', 'Minuteur');
        return;

      case 'blocked':
        this.reset();
        this.toastr.warning(
          'Blocage noté : signale-le pour être débloqué.',
          'Minuteur',
        );
        return;

      case 'extend':
        this.extendMinutes(answer.minutes);
        return;

      default:
        // Dialogue fermé sans réponse : on repart au repos, sans commentaire.
        this.reset();
    }
  }

  /** Relance aussitôt une session de la durée demandée. */
  private extendMinutes(minutes: number): void {
    this.durationSeconds = Math.max(1, Math.round(minutes * 60));
    this.pausedRemainingMs = null;
    this.status = 'idle';

    this.start();
    this.toastr.info(`C'est reparti pour ${minutes} min.`, 'Minuteur');
  }

  // -------------------------------------------------------------------------
  // État
  // -------------------------------------------------------------------------

  private remainingMs(): number {
    if (this.status === 'running' && this.endsAt !== null) {
      return Math.max(0, this.endsAt - Date.now());
    }
    if (this.status === 'paused' && this.pausedRemainingMs !== null) {
      return this.pausedRemainingMs;
    }
    return this.status === 'finished' ? 0 : this.durationSeconds * 1000;
  }

  private snapshot(): TimerState {
    const remainingSeconds = Math.ceil(this.remainingMs() / 1000);
    const elapsed = this.durationSeconds - remainingSeconds;

    return {
      status: this.status,
      durationSeconds: this.durationSeconds,
      remainingSeconds,
      progressPercent: this.durationSeconds > 0
        ? Math.min(100, Math.max(0, (elapsed / this.durationSeconds) * 100))
        : 0,
    };
  }

  private publish(): void {
    this.stateSubject.next(this.snapshot());
    this.persist();
  }

  // -------------------------------------------------------------------------
  // Persistance : un rafraîchissement accidentel ne doit pas perdre la session
  // -------------------------------------------------------------------------

  private persist(): void {
    try {
      localStorage.setItem(TimerService.STORAGE_KEY, JSON.stringify({
        durationSeconds: this.durationSeconds,
        endsAt: this.endsAt,
        pausedRemainingMs: this.pausedRemainingMs,
        status: this.status,
      }));
    } catch {
      // Stockage indisponible (navigation privée, quota) : sans conséquence.
    }
  }

  private restore(): void {
    let saved: any;
    try {
      const raw = localStorage.getItem(TimerService.STORAGE_KEY);
      if (!raw) {
        return;
      }
      saved = JSON.parse(raw);
    } catch {
      return;
    }

    if (typeof saved?.durationSeconds === 'number' && saved.durationSeconds > 0) {
      this.durationSeconds = saved.durationSeconds;
    }

    if (saved?.status === 'running' && typeof saved.endsAt === 'number') {
      // Le minuteur a pu arriver à échéance pendant que l'onglet était fermé.
      if (saved.endsAt > Date.now()) {
        this.endsAt = saved.endsAt;
        this.status = 'running';
      } else {
        this.status = 'finished';
      }
      return;
    }

    if (saved?.status === 'paused' && typeof saved.pausedRemainingMs === 'number') {
      this.pausedRemainingMs = saved.pausedRemainingMs;
      this.status = 'paused';
    }
  }

  ngOnDestroy(): void {
    this.stopTicking();
  }
}
