import { Component, Input } from '@angular/core';

type SkeletonType = 'line' | 'circle' | 'rect' | 'card-project' | 'list-item';

@Component({
  selector: 'app-skeleton',
  standalone: false,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.css'
})
export class SkeletonComponent {
  @Input() type: SkeletonType = 'line';
  @Input() width: string = '100%';
  @Input() height: string = '14px';
  @Input() count: number = 1;

  get items() {
    return Array(this.count).fill(0);
  }
}
