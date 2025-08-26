import { Component } from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {animate, keyframes, style, transition, trigger} from "@angular/animations";

@Component({
  standalone:false,
  selector: 'app-public',
  templateUrl: './public.component.html',
  styleUrl: './public.component.css',
  animations:[
    trigger('publicAnim',[
      transition('* => login',[
        animate('0.8s 0s ease', keyframes([
          style({ opacity: '0.3', transform: 'translateY(-100%) rotateX(-90deg)', offset: 0}),
          style({opacity: '1', transform: 'translateX(0%) rotateY(0deg)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class PublicComponent {

  getState(o: RouterOutlet) {
    return o.activatedRouteData['state'];
  }
}
