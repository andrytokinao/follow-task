import {Component, Input} from '@angular/core';
import {NotificationApp, User} from "../../type/issue";
import {UserService} from "../../services/user.service";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-notifications',
  standalone:false,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
  @Input() notifications:NotificationApp[] = [];
  private connectedId : String;
  constructor(private userService:UserService, private authService:AuthService) {
    this.authService.connectedUser$.subscribe(u => {
      if (u && u.id) {
        this.connectedId = u.id;
      }
    })
  }
  urlPhoto(user:User) {
    return this.userService.getUrlPhoto(user);
  }

  isRedead(notification: NotificationApp) {
    if (!notification.seenUserIds || notification.seenUserIds.length == 0 )
      return '';
    if (notification.seenUserIds.includes(this.connectedId)) {
      return 'redead';
    }
    return '';
  }
}
