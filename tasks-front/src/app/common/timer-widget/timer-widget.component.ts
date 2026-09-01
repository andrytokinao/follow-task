import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TimerService, TimerState} from '../../services/timer.service';

/**
 * Pastille de minuteur, ancrée en bas à droite de l'espace de travail.
 *
 * Repliée, elle n'affiche que le temps restant ; dépliée, elle donne les
 * durées prédéfinies et les commandes. Tout l'état vit dans
 * {@link TimerService} : ce composant n'est qu'une vue, et peut donc être
 * détruit puis recréé au fil des navigations sans interrompre le décompte.
 */
@Component({
  standalone: true,
  selector: 'app-timer-widget',
  imports: [CommonModule, FormsModule],
  templateUrl: './timer-widget.component.html',
  styleUrls: ['./timer-widget.component.scss'],
})
export class TimerWidgetComponent {

  readonly presets = TimerService.PRESETS_MINUTES;
  readonly state$ = this.timer.state$;

  expanded = false;

  /** Durée libre saisie dans le panneau, en minutes. */
  customMinutes: number | null = null;

  constructor(private readonly timer: TimerService) {
  }

  togglePanel(): void {
    this.expanded = !this.expanded;
  }

  /**
   * Clic sur la pastille. Tant que la session est en « temps écoulé », il
   * repose la question de fin plutôt que d'ouvrir le panneau : c'est la
   * réponse qui manque, pas les réglages.
   */
  onPillClick(state: TimerState): void {
    if (state.status === 'finished') {
      this.timer.askOutcome();
      return;
    }
    this.togglePanel();
  }

  /** Bascule marche/pause sans ouvrir le panneau. */
  toggleRun(event: Event): void {
    event.stopPropagation();
    this.timer.toggle();
  }

  choosePreset(minutes: number): void {
    this.customMinutes = null;
    this.timer.setDurationMinutes(minutes);
  }

  applyCustom(): void {
    if (this.customMinutes && this.customMinutes > 0) {
      this.timer.setDurationMinutes(this.customMinutes);
    }
  }

  start(): void {
    this.timer.start();
  }

  pause(): void {
    this.timer.pause();
  }

  reset(): void {
    this.customMinutes = null;
    this.timer.reset();
  }

  /** Une durée est active si elle correspond à celle qui est configurée. */
  isPreset(state: TimerState, minutes: number): boolean {
    return state.durationSeconds === minutes * 60;
  }

  /** `1500` → « 25:00 », `3725` → « 1:02:05 ». */
  format(totalSeconds: number): string {
    const safe = Math.max(0, totalSeconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;

    const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
    const ss = String(seconds).padStart(2, '0');

    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  /** Libellé de l'état, repris par le lecteur d'écran. */
  statusLabel(state: TimerState): string {
    switch (state.status) {
      case 'running':
        return 'Minuteur en cours';
      case 'paused':
        return 'Minuteur en pause';
      case 'finished':
        return 'Temps écoulé';
      default:
        return 'Minuteur à l\'arrêt';
    }
  }
}
