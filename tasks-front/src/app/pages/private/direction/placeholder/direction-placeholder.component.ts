import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

/**
 * Écran du cockpit annoncé mais pas encore livré. Il décrit ce qu'il
 * contiendra, à partir des données de la route, plutôt qu'une page vide.
 */
@Component({
  standalone: false,
  selector: 'app-direction-placeholder',
  template: `
    <div class="soon">
      <span class="soon-icon"><i [ngClass]="data['icone']"></i></span>
      <span class="soon-tag">En préparation</span>
      <h2>{{ data['titre'] }}</h2>
      <p>{{ data['promesse'] }}</p>
      <a class="soon-back" routerLink="../overview">
        <i class="fas fa-arrow-left"></i> Revenir à la vue d'ensemble
      </a>
    </div>
  `,
  styles: [`
    .soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
      padding: 72px 24px;
      background: var(--dir-surface);
      border: 1px solid var(--dir-border);
      border-radius: var(--dir-radius);
      box-shadow: var(--dir-shadow);
    }
    .soon-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: var(--dir-accent-soft);
      color: var(--dir-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      margin-bottom: 6px;
    }
    .soon-tag {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--dir-ink-3);
    }
    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--dir-ink);
    }
    p {
      margin: 0;
      max-width: 460px;
      font-size: 13.5px;
      line-height: 1.55;
      color: var(--dir-ink-2);
    }
    .soon-back {
      margin-top: 10px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--dir-accent);
      text-decoration: none;
    }
    .soon-back:hover {
      text-decoration: underline;
    }
  `]
})
export class DirectionPlaceholderComponent {
  readonly data;

  constructor(route: ActivatedRoute) {
    this.data = route.snapshot.data;
  }
}
