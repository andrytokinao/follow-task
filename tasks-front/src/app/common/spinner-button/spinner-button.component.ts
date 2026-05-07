import { Component, Input, Output, EventEmitter } from '@angular/core';

export type SpinnerButtonVariant = 'primary' | 'danger' | 'outline' | 'success';
export type SpinnerButtonState   = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-spinner-button',
  imports:[],
  template: `
    <button
      class="spin-btn"
      [class]="'spin-btn spin-btn--' + currentVariant"
      [disabled]="state === 'loading' || disabled"
      (click)="onClick()">

      <span class="spin-spinner"
            [class.spin-spinner--dark]="variant === 'outline'"
            *ngIf="state === 'loading'">
      </span>

      <i [class]="iconClass" *ngIf="state !== 'loading'"></i>

      <span class="spin-label">{{ currentLabel }}</span>
    </button>
  `,
  styleUrl: './spinner-button.component.css'
})
export class SpinnerButtonComponent {

  @Input() label       = 'Envoyer';
  @Input() labelLoading = 'Envoi…';
  @Input() labelSuccess = 'Enregistré';
  @Input() labelError   = 'Erreur';

  @Input() icon        = 'fas fa-paper-plane';
  @Input() iconSuccess = 'fas fa-check';
  @Input() iconError   = 'fas fa-times';

  @Input() variant: SpinnerButtonVariant = 'primary';
  @Input() disabled = false;

  @Input() set loading(val: boolean) {
    this.state = val ? 'loading' : 'idle';
  }

  @Output() clicked = new EventEmitter<void>();

  state: SpinnerButtonState = 'idle';

  get currentLabel(): string {
    switch (this.state) {
      case 'loading': return this.labelLoading;
      case 'success': return this.labelSuccess;
      case 'error':   return this.labelError;
      default:        return this.label;
    }
  }

  get currentVariant(): SpinnerButtonVariant {
    if (this.state === 'success') return 'success';
    if (this.state === 'error')   return 'danger';
    return this.variant;
  }

  get iconClass(): string {
    if (this.state === 'success') return this.iconSuccess;
    if (this.state === 'error')   return this.iconError;
    return this.icon;
  }

  onClick(): void {
    this.clicked.emit();
  }

  /** Appelé depuis le parent après subscribe next */
  markSuccess(resetDelay = 2000): void {
    this.state = 'success';
    setTimeout(() => this.state = 'idle', resetDelay);
  }

  /** Appelé depuis le parent après subscribe error */
  markError(resetDelay = 2500): void {
    this.state = 'error';
    setTimeout(() => this.state = 'idle', resetDelay);
  }
}
