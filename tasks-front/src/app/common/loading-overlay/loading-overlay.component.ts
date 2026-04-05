import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.css'
})
export class LoadingOverlayComponent {
  @Input() message: string = 'Veuillez patienter';
  @Input() visible: boolean = false;
}
