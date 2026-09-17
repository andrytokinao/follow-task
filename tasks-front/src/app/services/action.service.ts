import {Injectable, OnInit} from '@angular/core';
import {HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpParams, HttpRequest} from '@angular/common/http';
import {BehaviorSubject, concatMap, finalize, observable, Observable, of, switchMap, tap, throwError} from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import {
  Issue,
  Status,
  User,
  Comment,
  Repertoire,
  ConfigEntry,
  Project,
  IssueType,
  WorkFlow,
  Criteria,
  CustomField,
  UsingCustomField,
  CustomFieldValue,
  ConfigProject,
  GroupeUser,
  Uploading,
  Uploaded,
  DocumentApp,
  DomainActivity, Label, IssueLabels, AppSettings, NotificationApp, ResponseApp, ActionHistorique
} from "../type/issue";
import {Apollo} from "apollo-angular";
import * as operation from "../type/graphql.operations";
import {stripTypename} from "@apollo/client/utilities";
import {error} from "@angular/compiler-cli/src/transformers/util";
import {
  AFFECT_ISSUE_TYPE_FOR_PARENT,
  ALL_CUSTOM_FIELD, ALL_ISSUE_TYPE,
  CUSTOM_FIELD_BY_ISSUE_TYPE,
  GET_CONFIG_PROJECT,
  GET_CUSTOM_FIELD,
  GET_GROUPE_USER_FOR_PROJECT, GET_ISSUE,
  GET_ISSUE_TYPE_BY_ID,
  GET_NEXT_KEY, GET_PROJECT_BY_USER,
  ISSUE_BY_CRITERIA, LIST_ISSUE_TYPE_MASTER, LIST_ISSUE_TYPE_SUBTASKS, LOAD_ISSUE_MASTER_BY_PROJECT, LOAD_SUBTASK,
  REMOVE_ISSUE_TYPE_PARENT,
  SAVE_CONFIG,
  SAVE_CONFIG_PROJECT, SEARCH_ISSUES,
  supprimerTypename,
  UN_USE_CUSTOM_FIELD,
  USE_CUSTOM_FIELD,
  WORK_FLOWS_BY_PROJECT
} from "../type/graphql.operations";
import {environment} from "../../environments/environment";
import {CustomFilter, IssueSearchCriteriaInput} from "../type/issue-search-criteria.util";
import {ActivatedRoute, Router} from "@angular/router";
import {UserService} from "./user.service";
import {NewIssueComponent} from "../pages/private//project/modal/new-issue/new-issue.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueFilterFieldComponent} from "../common/issue-filter-field/issue-filter-field.component";
import {ViewEditIssueComponent} from "../pages/private//project/modal/view-edit-issue/view-edit-issue.component";
import {PlanningIssueComponent} from "../pages/private/project/modal/planning-issue/planning-issue.component";
import {AuthService} from "./auth.service";
import {id} from "@swimlane/ngx-charts";
import {List} from "gojs";
import {sequence} from "@angular/animations";
import _default from "chart.js/dist/plugins/plugin.tooltip";
import numbers = _default.defaults.animations.numbers;
import {J} from "@angular/cdk/keycodes";
import {ProjectGuard} from "./ProjectGuard";
import {NewDocumentComponent} from "../pages/private/project/modal/new-document/new-document.component";
import {NotificationService} from "./notification.service";

@Injectable({
  providedIn: 'root',
})
export class ActionService implements OnInit {
 /**
  * Les notifications vivent desormais dans NotificationService, qui est la
  * source unique du front. Ce service n'en garde que des relais, pour les
  * ecrans qui l'injectaient deja : deux listes paralleles finiraient toujours
  * par diverger, et c'est exactement ce qu'on veut eviter — une notification
  * marquee lue ici doit s'eteindre partout ailleurs.
  */
 readonly notification$ = this.notificationService.notifications$;
 /** Compteur de la cloche : les notifications que l'utilisateur n'a pas vues. */
 readonly unreadedNotification$ = this.notificationService.unseenCount$;
 connectedUser: User;


  constructor(private http: HttpClient,
              private apollo: Apollo,
              private router: Router,
              private userService: UserService,
              private modalService: NgbModal,
              private authService: AuthService,
              protected projectGuard: ProjectGuard,
              private notificationService: NotificationService,
  ) {
    this.authService.connectedUser$.subscribe(user => {
      this.connectedUser = user;
    });
  }
  nextNotification(notification:NotificationApp){
    this.notificationService.push(notification);
  }

  ngOnInit(): void {


  }
  /** Relais : le magasin sait deja pour quel utilisateur il travaille. */
  loadNotifications(id: string) {
    this.notificationService.reload();
  }
  getNotificationsByUserId(userId:String) {
    return new Observable<NotificationApp[]>(observer => {
      this.apollo.query({
        query: operation.GET_NOTIFICATIONS_BY_USER_ID,
        variables: {userId},
        fetchPolicy: 'network-only'
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.getNotificationsByUserId));
          observer.complete();
        }, error => {
          console.error(error);
          observer.complete();
        }
      )
    });
  }

  seenNotification(userId: String) {
    return this.notificationService.seenNotification(userId);
  }

  /** Historique d'une issue, les actions les plus récentes d'abord. */
  getIssueHistory(issueId: number): Observable<ActionHistorique[]> {
    return this.apollo.query({
      query: operation.GET_ISSUE_HISTORY,
      variables: {issueId},
      fetchPolicy: 'network-only'
    }).pipe(
      map((res: any) => supprimerTypename(res.data.getIssueHistory) ?? [])
    );
  }

}
