import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

/**
 * Écran du cockpit annoncé mais pas encore livré. Il décrit ce qu'il
 * contiendra, à partir des données de la route, plutôt qu'une page vide.
 */
@Component({
  standalone: false,
  selector: 'app-direction-placeholder',
  templateUrl: './direction-placeholder.component.html',
  styleUrls: ['./direction-placeholder.component.css']
})
export class DirectionPlaceholderComponent {
  readonly data;

  constructor(route: ActivatedRoute) {
    this.data = route.snapshot.data;
  }
}
