import {Injectable, OnInit} from '@angular/core';
import {HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpParams, HttpRequest} from '@angular/common/http';
import {BehaviorSubject, concatMap, finalize, observable, Observable, of, switchMap, tap, throwError} from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
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
  DomainActivity, Label, IssueLabels, AppSettings, NotificationApp
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

@Injectable({
  providedIn: 'root',
})
export class ActionService implements OnInit {
 private notificationsSubject = new BehaviorSubject<NotificationApp[]>([]);
 notification$ = this.notificationsSubject.asObservable();


  constructor(private http: HttpClient,
              private apollo: Apollo,
              private router: Router,
              private userService: UserService,
              private modalService: NgbModal,
              private authService: AuthService,
              protected projectGuard: ProjectGuard,
  ) {

  }
  nextNotification(notification:NotificationApp){
    const currentNotification = this.notificationsSubject.getValue();
    this.notificationsSubject.next([...currentNotification, notification]);
  }

  ngOnInit(): void {
  }
  loadNotifications(id: string) {
    this.getNotificationsByUserId(id).subscribe(notifications => {
      this.notificationsSubject.next(notifications);
    });
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
}
