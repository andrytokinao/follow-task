import {Component, Input} from '@angular/core';
import {NotificationApp, User} from "../../type/issue";
import {UserService} from "../../services/user.service";

@Component({
  selector: 'app-notifications',
  standalone:false,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
  @Input() notifications:NotificationApp[] = [];
  constructor(private userService:UserService) {

  }
  urlPhoto(user:User) {
    return this.userService.getUrlPhoto(user);
  }

  isRedead(notification: NotificationApp) {
    return 'redead';
  }
}
