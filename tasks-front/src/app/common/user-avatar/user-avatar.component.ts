import { Component, Input, HostBinding } from '@angular/core';

@Component({
  selector: 'user-avatar',
  standalone: true,
  template: `
    <img
      [src]="src"
      [alt]="alt"
      [class]="imgClass"
      [style]="imgStyle"
    />
  `,
  styles: [`
    :host {
      display: inline-block;
      vertical-align: middle;
      line-height: 0;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
    }
  `]
})
export class UserAvatarComponent {
  @Input() src: string = '';
  @Input() alt: string = 'Avatar';
  @Input() imgClass: string = '';
  @Input() imgStyle: string = '';
}
