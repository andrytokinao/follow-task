import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';

/** Ce que l'utilisateur répond une fois le temps écoulé. */
export type TimerEndAnswer =
  | { kind: 'done' }
  | { kind: 'blocked' }
  | { kind: 'extend'; minutes: number };

export interface TimerEndDialogData {
  /** Durée de la session qui vient de s'achever, en secondes. */
  durationSeconds: number;
}

/**
 * Question posée quand le minuteur atteint 00:00.
 *
 * Trois issues : la tâche est finie, elle est bloquée, ou elle a besoin d'un
 * rallongement — auquel cas on demande combien. Le dialogue ne décide de rien :
 * il rend une réponse, et c'est le {@link TimerService} qui l'applique.
 */
@Component({
  standalone: true,
  selector: 'app-timer-end-dialog',
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './timer-end-dialog.component.html',
  styleUrls: ['./timer-end-dialog.component.scss'],
})
export class TimerEndDialogComponent {

  /** Rallonges proposées en un clic, en minutes. */
  static readonly EXTENSION_PRESETS_MINUTES = [5, 10, 15, 25];

  readonly extensions = TimerEndDialogComponent.EXTENSION_PRESETS_MINUTES;

  /** Le choix des durées n'apparaît qu'après « Demander plus de temps ». */
  choosingTime = false;

  /** Rallonge sélectionnée, en minutes. */
  selectedMinutes = TimerEndDialogComponent.EXTENSION_PRESETS_MINUTES[0];

  /** Rallonge libre ; prioritaire sur la sélection dès qu'elle est valide. */
  customMinutes: number | null = null;

  constructor(
    private readonly dialogRef: MatDialogRef<TimerEndDialogComponent, TimerEndAnswer>,
    @Inject(MAT_DIALOG_DATA) readonly data: TimerEndDialogData,
  ) {
  }

  done(): void {
    this.dialogRef.close({kind: 'done'});
  }

  blocked(): void {
    this.dialogRef.close({kind: 'blocked'});
  }

  askMoreTime(): void {
    this.choosingTime = true;
  }

  back(): void {
    this.choosingTime = false;
  }

  select(minutes: number): void {
    this.selectedMinutes = minutes;
    this.customMinutes = null;
  }

  /** La rallonge retenue : la saisie libre si elle est valide, sinon la pastille active. */
  get extensionMinutes(): number {
    return this.customMinutes && this.customMinutes > 0
      ? Math.round(this.customMinutes)
      : this.selectedMinutes;
  }

  confirmExtension(): void {
    this.dialogRef.close({kind: 'extend', minutes: this.extensionMinutes});
  }

  /** Durée de la session écoulée, pour rappel dans l'en-tête. */
  get sessionLabel(): string {
    const minutes = Math.round(this.data.durationSeconds / 60);
    return minutes >= 60
      ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
      : `${minutes} min`;
  }
}
