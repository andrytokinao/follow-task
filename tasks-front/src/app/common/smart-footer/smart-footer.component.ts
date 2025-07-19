import { Component } from '@angular/core';
import {animate, keyframes, style, transition, trigger, useAnimation} from "@angular/animations";
import {NgForOf, NgIf, NgStyle} from "@angular/common";
import {Canall, NotificationApp, User} from "../../type/issue";
import {ActionService} from "../../services/action.service";
import {MyCommonModule} from "../common.module";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {AuthService} from "../../services/auth.service";
import {rotateRoomToBottom} from "../../../../projects/router-animations/src/lib/router-animations";
import {MessagesService} from "../../services/messages.service";
import {UserService} from "../../services/user.service";

@Component({
  selector: 'smart-footer',
  standalone:false,
  templateUrl: './smart-footer.component.html',
  styleUrl: './smart-footer.component.css',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(-30%)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', keyframes([
          style({ transform: 'translate(0, 0)', opacity: 1, offset: 0 }),
          style({ transform: 'translate(30px, 30px)', opacity: 0, offset: 1 })
        ]))
      ])
    ]),
    trigger('rotateRoomToBottom', [ transition('* => *', useAnimation(rotateRoomToBottom))]),

  ]
})
export class SmartFooterComponent {
  protected notifications: NotificationApp[] ;
  protected unrededNofication = 0;
  connectedUser: User | undefined;

  constructor(
    protected actionService:ActionService,
    private authService: AuthService,
    private messageService:MessagesService,
    protected  userService:UserService

  ) {
    this.actionService.notification$.subscribe(nots => {
      this.notifications = nots;
    });
    this.actionService.unreadedNotification$.subscribe( nbr => {
      this.unrededNofication = nbr;
    });
    this.authService.connectedUser$.subscribe(user => {
      this.connectedUser = user;
    });
    this.messageService.showCanals$.subscribe(cnl=>{
      this.addItem(cnl);
    });
    this.messageService.closeCanals$.subscribe(cnl=>{
      if (!cnl || !cnl.id)
        return;
        this.removeItem(cnl);
    })
    this.messageService.showSmartRight$.subscribe(show =>{
      this.showNotif = show;
    })
  }
  chanelItems: Canall[] = [];

  maxItems = 3;
  showNotif: string;

  addItem(canal: Canall) {
    let cns = this.chanelItems.filter(c=>c.id === canal.id);
    if( cns && cns.length > 0)
      return;
    console.log(this.messageService.chatName(canal));
    if (this.chanelItems.length >= this.maxItems) {
      this.chanelItems.shift();
      setTimeout(() => this.chanelItems.push(canal), 500);
    } else {
      this.chanelItems.push(canal);
    }


  }

  removeOldest() {
    this.chanelItems.shift();
  }
  setShowNotif(show:string){
    if (show === this.showNotif)
      this.showNotif = '';
    else
      this.showNotif = show;
  }

  seenNotification() {
    this.actionService.seenNotification(this.connectedUser.id).subscribe( res => {
      console.log('seenNotification',res);
    });
  }

  private removeItem(cnl: Canall) {
    this.chanelItems = this.chanelItems.filter(cn => cn.id !==cnl.id);
  }
}
