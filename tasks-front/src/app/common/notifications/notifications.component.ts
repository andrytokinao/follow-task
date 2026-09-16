import {Component, Input} from '@angular/core';
import {NotificationApp, User} from "../../type/issue";
import {UserService} from "../../services/user.service";
import {NotificationService} from "../../services/notification.service";

/**
 * Panneau de la cloche. Il n'a pas d'état propre : il affiche la liste que lui
 * passe le pied de page, et tout marquage repasse par NotificationService.
 * C'est ce qui garantit qu'ouvrir une tâche depuis ici éteint aussi la
 * pastille des menus.
 */
@Component({
  selector: 'app-notifications',
  standalone:false,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
  @Input() notifications:NotificationApp[] = [];

  constructor(private userService:UserService,
              private notificationService:NotificationService) {
  }

  urlPhoto(user:User) {
    return this.userService.getUrlPhoto(user);
  }

  /** Non lue : la tâche concernée n'a pas encore été ouverte. */
  estNonLue(notification: NotificationApp): boolean {
    return !this.notificationService.estLue(notification);
  }

  /** Conservé : les gabarits existants appellent encore isRedead. */
  isRedead(notification: NotificationApp) {
    return this.notificationService.estVue(notification) ? 'redead' : '';
  }

  titre(notification: NotificationApp): String {
    return notification?.titre || 'Activité';
  }

  /** « PRJ-12 · Corriger la connexion », ou la clé seule si le titre manque. */
  tache(notification: NotificationApp): String {
    const issue: any = notification?.issue ?? notification?.action?.issue;
    if (!issue) {
      return '';
    }
    return issue.summary ? `${issue.issueKey} · ${issue.summary}` : issue.issueKey ?? '';
  }

  /**
   * Suivre le lien vaut lecture : la notification a rempli son office, et la
   * marque doit s'éteindre ici comme dans les menus.
   */
  ouvrir(notification: NotificationApp) {
    const issue: any = notification?.issue ?? notification?.action?.issue;
    this.notificationService.markIssueRead(issue?.id);
  }

  toutMarquerLu() {
    this.notificationService.markAllRead();
  }
}
