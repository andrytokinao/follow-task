import {animate, style, transition, trigger} from '@angular/animations';

/**
 * Une ligne ou un projet du Gantt qui se masque se replie en s'effaçant ;
 * qui revient se déplie en apparaissant.
 */
export const REPLI_GANTT = trigger('repli', [
  transition(':enter', [
    style({height: 0, opacity: 0, overflow: 'hidden', transform: 'translateX(-12px)'}),
    animate('320ms cubic-bezier(.2, .8, .2, 1)', style({height: '*', opacity: 1, transform: 'none'}))
  ]),
  transition(':leave', [
    style({overflow: 'hidden'}),
    animate('260ms ease-in', style({height: 0, opacity: 0, transform: 'translateX(12px)'}))
  ])
]);
