import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {BehaviorSubject, distinctUntilChanged, map, Observable, shareReplay} from 'rxjs';
import {NotificationApp, ResponseApp, User} from '../type/issue';
import * as operation from '../type/graphql.operations';
import {supprimerTypename} from '../type/graphql.operations';
import {AuthService} from './auth.service';

/**
 * Source unique des notifications du front.
 *
 * Tout ce qui s'affiche — le compteur de la cloche, la pastille du menu
 * Projets, celle du menu Tâches, le fond des lignes de liste — est dérivé de
 * la *même* liste `notifications`. Aucun écran ne tient son propre compteur.
 * C'est ce qui fait qu'ouvrir une tâche éteint la marque partout à la fois :
 * il n'y a qu'un état à corriger, et toutes les vues le relisent.
 *
 * Deux états cohabitent, et ils ne veulent pas dire la même chose :
 *
 * - « vu » (`seenUserIds`) : l'utilisateur a déroulé le panneau de la cloche.
 *   Cela remet le compteur de la cloche à zéro, rien de plus.
 * - « lu » (`readUserIds`) : l'utilisateur a ouvert la tâche concernée. C'est
 *   cet état qui pilote les pastilles des menus et le fond des lignes.
 *
 * Les séparer évite qu'un coup d'œil à la cloche fasse disparaître les repères
 * qui servent justement à retrouver la tâche.
 */
@Injectable({providedIn: 'root'})
export class NotificationService {

  private readonly notificationsSubject = new BehaviorSubject<NotificationApp[]>([]);

  /** La liste complète, la plus récente en tête. */
  readonly notifications$ = this.notificationsSubject.asObservable();

  private connectedUser: User | undefined;

  /** Vrai une fois la liste du compte courant reçue du serveur. */
  private chargee = false;

  // ---------------------------------------------------------------------
  // Vues dérivées
  // ---------------------------------------------------------------------

  /** Non vues : le compteur rouge de la cloche. */
  readonly unseenCount$: Observable<number> = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !this.estVue(n)).length),
    distinctUntilChanged(),
    shareReplay(1)
  );

  /** Non lues : total des pastilles contextuelles. */
  readonly unreadCount$: Observable<number> = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !this.estLue(n)).length),
    distinctUntilChanged(),
    shareReplay(1)
  );

  /**
   * Les notifications non lues elles-mêmes, rangées par tâche — pas seulement
   * leur nombre.
   *
   * Un compteur dit qu'il se passe quelque chose, jamais quoi : « 2 » sur une
   * ligne oblige à ouvrir la tâche pour découvrir qu'il s'agissait d'un
   * changement de statut sans intérêt pour soi. Les messages étant déjà
   * rédigés côté serveur, les remonter ici permet de les montrer au survol.
   *
   * Une notification portant sur une sous-tâche est rangée deux fois : sous la
   * sous-tâche et sous sa demande parente. Sans ce report, la pastille d'une
   * demande resterait éteinte alors que quelque chose bouge en dessous, et
   * l'utilisateur n'aurait aucune raison de l'ouvrir.
   */
  readonly unreadDetailsByIssue$: Observable<Map<number, NotificationApp[]>> = this.notifications$.pipe(
    map(notifications => {
      const details = new Map<number, NotificationApp[]>();
      notifications
        .filter(n => !this.estLue(n))
        .forEach(n => {
          const issue = this.issueDe(n);
          this.ranger(details, this.enNombre(issue?.id), n);
          this.ranger(details, this.enNombre(issue?.parent?.id ?? (issue as any)?.parentId), n);
        });
      return details;
    }),
    shareReplay(1)
  );

  /** Idem par projet : alimente l'infobulle des menus Projets et Tâches. */
  readonly unreadDetailsByProject$: Observable<Map<number, NotificationApp[]>> = this.notifications$.pipe(
    map(notifications => {
      const details = new Map<number, NotificationApp[]>();
      notifications
        .filter(n => !this.estLue(n))
        .forEach(n => this.ranger(details, this.projectId(n), n));
      return details;
    }),
    shareReplay(1)
  );

  /** Non lues par identifiant de projet, déduites du détail. */
  readonly unreadByProject$: Observable<Map<number, number>> =
    this.unreadDetailsByProject$.pipe(map(details => this.tailles(details)), shareReplay(1));

  /** Non lues par identifiant de tâche, déduites du détail. */
  readonly unreadByIssue$: Observable<Map<number, number>> =
    this.unreadDetailsByIssue$.pipe(map(details => this.tailles(details)), shareReplay(1));

  unreadForProject$(projectId: number | undefined): Observable<number> {
    return this.unreadByProject$.pipe(
      map(compteurs => (projectId == null ? 0 : compteurs.get(Number(projectId)) ?? 0)),
      distinctUntilChanged()
    );
  }

  unreadForIssue$(issueId: number | undefined): Observable<number> {
    return this.unreadByIssue$.pipe(
      map(compteurs => (issueId == null ? 0 : compteurs.get(Number(issueId)) ?? 0)),
      distinctUntilChanged()
    );
  }

  /**
   * Résumé en texte, pour une infobulle : une ligne par évènement, les plus
   * récents d'abord, avec l'heure. C'est ce qui manquait au compteur seul —
   * « 2 » n'apprend rien, « Andry a fait passer PRJ-12 de En attente à En
   * cours » évite d'ouvrir la tâche pour rien.
   *
   * Au-delà de `max`, on compte le reste plutôt que d'étirer l'infobulle hors
   * de l'écran.
   */
  resumeTexte(notifications: NotificationApp[] | undefined, entete?: string, max = 4): string {
    if (!notifications?.length) {
      return '';
    }
    const lignes = notifications.slice(0, max)
      .map(n => `• ${n.message}${this.quand(n)}`);
    const reste = notifications.length - max;
    if (reste > 0) {
      lignes.push(`… et ${reste} autre(s)`);
    }
    return (entete ? [entete, ...lignes] : lignes).join('\n');
  }

  /**
   * « — 16/09 14:32 ». Formatage manuel : formatDate exigerait que la locale
   * française soit enregistrée, ce dont cette infobulle n'a pas besoin.
   */
  private quand(notification: NotificationApp): string {
    if (!notification?.created) {
      return '';
    }
    const date = new Date(notification.created);
    if (isNaN(date.getTime())) {
      return '';
    }
    const p = (n: number) => String(n).padStart(2, '0');
    return ` — ${p(date.getDate())}/${p(date.getMonth() + 1)} ${p(date.getHours())}:${p(date.getMinutes())}`;
  }

  constructor(private apollo: Apollo, private authService: AuthService) {
    this.authService.connectedUser$.subscribe(user => {
      const changeDUtilisateur = user?.id !== this.connectedUser?.id;
      this.connectedUser = user;
      if (changeDUtilisateur) {
        // Les notifications sont nominatives : garder celles du précédent
        // compte afficherait des pastilles qui ne concernent plus personne.
        this.notificationsSubject.next([]);
        this.chargee = false;
        if (user?.id) {
          this.reload();
        }
      }
    });
  }

  // ---------------------------------------------------------------------
  // Alimentation
  // ---------------------------------------------------------------------

  /**
   * Recharge depuis le serveur. C'est le filet du websocket : à la connexion,
   * à chaque reconnexion et au retour sur l'onglet, on repart de la base
   * plutôt que d'espérer qu'aucun évènement ne s'est perdu.
   */
  reload(): void {
    const userId = this.connectedUser?.id;
    if (!userId) {
      return;
    }
    this.getNotificationsByUserId(userId).subscribe({
      next: notifications => {
        this.chargee = true;
        this.notificationsSubject.next(this.trier(notifications ?? []));
      },
      error: err => console.error('Rechargement des notifications impossible', err)
    });
  }

  /** Arrivée temps réel. Le doublon est écarté : le rechargement de rattrapage
   *  et le websocket peuvent livrer la même notification. */
  push(notification: NotificationApp): void {
    if (!notification || notification.id == null) {
      return;
    }
    const courantes = this.notificationsSubject.getValue();
    if (courantes.some(n => String(n.id) === String(notification.id))) {
      return;
    }
    this.notificationsSubject.next(this.trier([notification, ...courantes]));
  }

  /**
   * Écho d'une lecture faite ailleurs — autre onglet, téléphone. Le serveur
   * renvoie les identifiants touchés ; on aligne l'état local sans rien
   * recharger.
   */
  applyReadEcho(ids: Array<number | string>, lue: boolean): void {
    const userId = this.connectedUser?.id;
    if (!userId || !ids?.length) {
      return;
    }
    const cibles = new Set(ids.map(id => String(id)));
    this.notificationsSubject.next(
      this.notificationsSubject.getValue().map(n =>
        cibles.has(String(n.id)) ? this.marquer(n, userId, lue) : n)
    );
  }

  // ---------------------------------------------------------------------
  // Marquage
  // ---------------------------------------------------------------------

  /** Panneau de la cloche déroulé : le compteur retombe, les pastilles restent. */
  markAllSeen(): void {
    const userId = this.connectedUser?.id;
    if (!userId) {
      return;
    }
    this.seenNotification(userId).subscribe({
      next: () => {
      },
      error: () => {
      }
    });
  }

  /**
   * Tâche affichée : c'est le geste qui éteint les marques la concernant.
   *
   * Appelé par les écrans qui montrent la tâche (demande, sous-tâche, fenêtre
   * d'édition) et non par les listes qui y mènent : une tâche ouverte par un
   * lien direct, le calendrier ou le fil d'ariane doit s'éteindre aussi.
   * Ces écrans rappellent la méthode à chaque rafraîchissement de la tâche ;
   * quand rien n'est à marquer, on ne dérange pas le serveur.
   */
  markIssueRead(issueId: number | undefined): void {
    const userId = this.connectedUser?.id;
    if (!userId || issueId == null) {
      return;
    }
    const cible = Number(issueId);
    const marquees = this.appliquerLocalement(
      n => !this.estLue(n) && this.enNombre(this.issueDe(n)?.id) === cible, true);
    // Liste pas encore chargée (lien ouvert au démarrage) : on ne sait pas
    // s'il y a quelque chose à lire, le serveur tranchera.
    if (marquees === 0 && this.chargee) {
      return;
    }
    this.muter(operation.READ_NOTIFICATIONS_BY_ISSUE, {userId, issueId: cible});
  }

  /** Demande ouverte : vaut lecture de ses sous-tâches. */
  markMasterRead(masterId: number | undefined): void {
    const userId = this.connectedUser?.id;
    if (!userId || masterId == null) {
      return;
    }
    const cible = Number(masterId);
    this.appliquerLocalement(n => {
      const issue = this.issueDe(n);
      const parentId = this.enNombre(issue?.parent?.id ?? (issue as any)?.parentId);
      return this.enNombre(issue?.id) === cible || parentId === cible;
    }, true);
    this.muter(operation.READ_NOTIFICATIONS_BY_MASTER, {userId, masterId: cible});
  }

  markProjectRead(projectId: number | undefined): void {
    const userId = this.connectedUser?.id;
    if (!userId || projectId == null) {
      return;
    }
    const cible = Number(projectId);
    this.appliquerLocalement(n => this.projectId(n) === cible, true);
    this.muter(operation.READ_NOTIFICATIONS_BY_PROJECT, {userId, projectId: cible});
  }

  markAllRead(): void {
    const userId = this.connectedUser?.id;
    if (!userId) {
      return;
    }
    this.appliquerLocalement(() => true, true);
    this.muter(operation.READ_ALL_NOTIFICATIONS, {userId});
  }

  /**
   * On met à jour la liste avant la réponse du serveur : la pastille doit
   * s'éteindre au clic, pas un aller-retour plus tard. En cas d'échec, le
   * prochain rechargement rétablit l'état réel.
   */
  private appliquerLocalement(concerne: (n: NotificationApp) => boolean, lue: boolean): number {
    const userId = this.connectedUser?.id;
    if (!userId) {
      return 0;
    }
    let touchees = 0;
    const liste = this.notificationsSubject.getValue()
      .map(n => {
        if (!concerne(n)) {
          return n;
        }
        touchees++;
        return this.marquer(n, userId, lue);
      });
    if (touchees > 0) {
      this.notificationsSubject.next(liste);
    }
    return touchees;
  }

  private marquer(notification: NotificationApp, userId: String, lue: boolean): NotificationApp {
    const seen = this.avec(notification.seenUserIds, userId);
    // Lire implique voir : une notification lue ne doit plus peser sur la cloche.
    const read = lue ? this.avec(notification.readUserIds, userId) : (notification.readUserIds ?? []);
    return {...notification, seenUserIds: seen, readUserIds: read};
  }

  private avec(liste: String[] | undefined, userId: String): String[] {
    const courant = liste ?? [];
    return courant.some(id => this.memeId(id, userId)) ? courant : [...courant, userId];
  }

  private muter(mutation: any, variables: any): void {
    this.apollo.mutate({mutation, variables}).subscribe({
      next: () => {
      },
      error: err => {
        console.error('Marquage des notifications refusé par le serveur', err);
        // L'état local était optimiste : on le remet d'aplomb.
        this.reload();
      }
    });
  }

  // ---------------------------------------------------------------------
  // Accès unitaires, pour les gabarits
  // ---------------------------------------------------------------------

  estVue(notification: NotificationApp): boolean {
    return this.contient(notification?.seenUserIds);
  }

  estLue(notification: NotificationApp): boolean {
    return this.contient(notification?.readUserIds);
  }

  private contient(liste: String[] | undefined): boolean {
    const userId = this.connectedUser?.id;
    return !!userId && (liste ?? []).some(id => this.memeId(id, userId));
  }

  private memeId(a: String | undefined, b: String | undefined): boolean {
    return !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase();
  }

  // ---------------------------------------------------------------------
  // Utilitaires
  // ---------------------------------------------------------------------

  /** La tâche peut arriver à plat (`issue`) ou sous l'action, selon l'âge de
   *  la charge utile ; on accepte les deux. */
  private issueDe(notification: NotificationApp): any {
    return notification?.issue ?? notification?.action?.issue;
  }

  private projectId(notification: NotificationApp): number | undefined {
    return this.enNombre(notification?.project?.id ?? this.issueDe(notification)?.project?.id);
  }

  private enNombre(valeur: any): number | undefined {
    if (valeur === null || valeur === undefined || valeur === '') {
      return undefined;
    }
    const n = Number(valeur);
    return isNaN(n) ? undefined : n;
  }

  /** Range une notification sous une clé, en créant la liste au besoin. */
  private ranger(details: Map<number, NotificationApp[]>, cle: number | undefined,
                 notification: NotificationApp): void {
    if (cle === undefined) {
      return;
    }
    const liste = details.get(cle);
    if (liste) {
      liste.push(notification);
      return;
    }
    details.set(cle, [notification]);
  }

  private tailles(details: Map<number, NotificationApp[]>): Map<number, number> {
    const compteurs = new Map<number, number>();
    details.forEach((liste, cle) => compteurs.set(cle, liste.length));
    return compteurs;
  }

  /** Plus récent en tête : l'identifiant est croissant, la date peut manquer. */
  private trier(notifications: NotificationApp[]): NotificationApp[] {
    return [...notifications].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
  }

  private getNotificationsByUserId(userId: String): Observable<NotificationApp[]> {
    return new Observable<NotificationApp[]>(observer => {
      this.apollo.query({
        query: operation.GET_NOTIFICATIONS_BY_USER_ID,
        variables: {userId},
        fetchPolicy: 'network-only'
      }).subscribe({
        next: (res: any) => {
          observer.next(supprimerTypename(res.data.getNotificationsByUserId));
          observer.complete();
        },
        error: error => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Marque tout « vu », en rendant la réponse du serveur aux appelants qui
   * l'attendent. L'état local bascule tout de suite : le compteur doit
   * retomber au clic, pas un aller-retour réseau plus tard.
   */
  seenNotification(userId: String): Observable<ResponseApp> {
    this.appliquerLocalement(() => true, false);
    return new Observable<ResponseApp>(observer => {
      this.apollo.mutate({
        mutation: operation.SEEN_NOTIFICATION,
        variables: {userId}
      }).subscribe({
        next: (res: any) => {
          observer.next(supprimerTypename(res.data.seenNotification));
          observer.complete();
        },
        error: error => {
          console.error('Marquage « vu » refusé par le serveur', error);
          this.reload();
          observer.error(error);
        }
      });
    });
  }
}
