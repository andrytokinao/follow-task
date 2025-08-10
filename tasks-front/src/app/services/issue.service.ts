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
  DomainActivity,
  Label,
  IssueLabels,
  AppSettings,
  NotificationApp,
  ResponseApp,
  ActionItem,
  ActionGroupe,
  ActionAssigne,
  ActionStatus
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
  REMOVE_ISSUE_TYPE_PARENT, SAVE_ACTION,
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
import {ImageModalContentComponent} from "../common/image-modal-content/image-modal-content.component";
import {MessagesService} from "./messages.service";

@Injectable({
  providedIn: 'root',
})
export class IssueService implements OnInit {
  projects: Project[] = [];
  project: Project | null = null;
  issueTypes: IssueType[] = [];
  appSettings: AppSettings[] = [];
  user: User | undefined;
  private subtaskSubject = new BehaviorSubject<Issue[]>([]);
  private issueMastersListSubject = new BehaviorSubject<Issue[]>([]);
  private projectSubject = new BehaviorSubject<Project>(undefined);
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  private worksFlowsSubject = new BehaviorSubject<WorkFlow[]>([]);
  private masterListCriteriaSubject = new BehaviorSubject<IssueSearchCriteriaInput>({});
  masterCriteria$ = this.masterListCriteriaSubject.asObservable();
  private issueMasterSubject = new BehaviorSubject<Issue>({});
  private myFiltersSubject = new BehaviorSubject<CustomFilter[]>([]);
  private masterFiltersSubject = new BehaviorSubject<CustomFilter[]>([]);
  private subtaskFiltersSubject = new BehaviorSubject<CustomFilter[]>([]);
  private loadedWorkspaceSubject = new BehaviorSubject<Boolean>(false);
  private loadingListSubtaskSubject = new BehaviorSubject<Boolean>(false);
  private globalSettingsSubject = new BehaviorSubject<AppSettings[]>([]);
  globalSettings$ = this.globalSettingsSubject.asObservable();
  private allLabelSubject = new BehaviorSubject<Label[]>([]);
  allLabel$ = this.allLabelSubject.asObservable();
  loadingListSubtask$ = this.loadingListSubtaskSubject.asObservable();
  loadedWorkspace$ = this.loadedWorkspaceSubject.asObservable();
  masterFilters$ = this.masterFiltersSubject.asObservable();
  subtaskFilter$ = this.subtaskFiltersSubject.asObservable();
  myFilters$ = this.myFiltersSubject.asObservable();
  workFlows$ = this.worksFlowsSubject.asObservable();
  subtask$ = this.subtaskSubject.asObservable();
  issueMaster$ = this.issueMasterSubject.asObservable();
  issueMasterList$ = this.issueMastersListSubject.asObservable();
  private issueTypesSubject = new BehaviorSubject<IssueType[]>([]);
  issueType$ = this.issueTypesSubject.asObservable();
  private issueTypesParentSubject = new BehaviorSubject<IssueType[]>([]);
  issueTypeParent$ = this.issueTypesParentSubject.asObservable();
  project$ = this.projectSubject.asObservable();
  projects$ = this.projectsSubject.asObservable();
  private masterCurrentMasterFilterSubject = new BehaviorSubject<CustomFilter>(null);
  private currentSubtaskFilterSubject = new BehaviorSubject<CustomFilter>(null);
  private currentSubtaskFilter$ = this.currentSubtaskFilterSubject.asObservable();
  currentMasterFilter$ = this.masterCurrentMasterFilterSubject.asObservable();
  private issuesSubject = new BehaviorSubject<Issue[]>([]);
  issues$ = this.issuesSubject.asObservable();
  uploadingDocumentSubject: BehaviorSubject<DocumentApp>;
  private allCustomFieldSubject = new BehaviorSubject<CustomField[]>([]);
  allCustomField$ = this.allCustomFieldSubject.asObservable();
  private masterCurrentMasterFilter: CustomFilter;
  private documentsSubject = new BehaviorSubject<DocumentApp[]>([]);
  documents$ = this.documentsSubject.asObservable();
  private slidingImageSubject = new BehaviorSubject<Repertoire>(undefined);
  currentSlidingImage$ = this.slidingImageSubject.asObservable();
  private issueTypeMastersListSubject = new BehaviorSubject<IssueType[]>([]);
  issueTypeMasters$ = this.issueTypeMastersListSubject.asObservable();

  setIssues(issues: Issue[]) {
    this.issuesSubject.next(issues);
  }

  setSubtask(issues: Issue[]) {
    this.subtaskSubject.next(issues);
  }

  curentMasterCriteria: IssueSearchCriteriaInput = {};

  constructor(private http: HttpClient,
              private apollo: Apollo,
              private router: Router,
              private userService: UserService,
              private modalService: NgbModal,
              private authService: AuthService,
              protected projectGuard: ProjectGuard,
  ) {
    const initialProject: Project = null;
    this.authService.connectedUser$.subscribe(user => {
      this.user = user;
      this.loadSettings();
      this.loadMyFilters();
    });

    this.project$.subscribe(project => {
      this.project = project;
      if (this.project && this.project.id) {
        this.workFlowsByProject(this.projectSubject.value.id).subscribe();
        this.loadUsers();
        this.loadIssueType();
        this.loadMyFilters();
        this.loadAllCustomField();
        this.setCurrentMasterFilter({
          id: 0,
          name: 'Tous',
          projectId: this.project.id,
          criteria: {}
        });
        this.loadIssueType();
        this.issueType$.subscribe(issueTypes => {
          let parentType = issueTypes.filter(it => it.level === 'PARENT');
          this.issueTypesParentSubject.next(parentType);
        })
      }

    });
    this.currentMasterFilter$.subscribe(filter => {

      if (filter && this.project) {
        this.searchIssues(filter.criteria, this.project.id).subscribe(issues => {
          this.setMasters(issues);
        });
      }
    });
  }

  filterMasterIssue(customFilter: CustomFilter) {
    this.setCurrentMasterFilter(customFilter);
    if (customFilter && customFilter.criteria) {
      this.loadIssueMasters(customFilter.criteria);
    }
  }

  loadIssueMasters(criteria: IssueSearchCriteriaInput) {
    criteria.issueTypeLevels = ['PARENT'];
    criteria.projectId = this.project?.id;
    this.setIssueMasterCriteria(criteria);
    this.projectGuard.hasCredential(["USER"]).subscribe(isUser => {
      if (isUser) {
        this.projectGuard.hasSimpleCredential(["CAN_VIEW_ASSIGN_ONLY"]).subscribe(viewOnly => {
          if (viewOnly) {
            criteria.assigneUsernames = [this.user.username];
            this.searchIssues(criteria, this.project.id).subscribe(masters => {
              this.setMasters(masters);
              return;
            })
          }
        })
        this.projectGuard.hasSimpleCredential(["CAN_VIEW_ONLY"]).subscribe(vewOnly => {
          if (vewOnly) {
            return;
          }
          // TODO : Ajout ici le filtre pour les observateur externe ,
          /* this.searchIssues(criteria,this.project.id).subscribe(masters => {
             this.setMasters(masters);
           })*/
        });
        this.projectGuard.hasCredential(["PROJECT_MANAGER", "ADMIN", "VIEW_ALL_TASK"]).subscribe(canVieAll => {
          if (canVieAll) {
            this.searchIssues(criteria, this.project.id).subscribe(masters => {
              this.setMasters(masters);
            })
          }

        });
      }
    })

  }

  updateProject(newProject: Project): void {
    this.projectSubject.next(newProject);
  }

  getCurrentProject(): Project {
    return this.projectSubject.value;
  }

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  nextIsLoadingWorkspace(value: Boolean) {
    this.loadedWorkspaceSubject.next(value);
  }

  getIssesTest(): Observable<Issue[]> {
    let url = "assets/issues.json";
    return this.http
      .get<Issue[]>(url)
      .pipe(retry(1), catchError(this.handleError));
  }

  getWorkFlowOld(project: string): Observable<Status[]> {
    let url = "assets/workflow-prj1.json";
    return this.http
      .get<Status[]>(url)
      .pipe(retry(1), catchError(this.handleError));
  }


  getIssues(projet: String | undefined) {
    return new Observable<Issue[]>(observer => {
      this.apollo
        .query({
          query: operation.ALL_ISSUE,
        }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.allIssue));
        this.setIssues(supprimerTypename(res.data.allIssue));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  createIssueMasterOld() {

    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.componentInstance.isMaster = true;
    dialogRef.result.then((result) => {
      dialogRef.result.then(res => {
        if (res != null) {
          this.reloadMasterList();

        }
      })
    })
  }
  createIssueMaster(){
  //  this.messageService.showRight('new-issue');
  }


  saveIssue(issue: any) {
    delete issue.encodedPath;
    if (issue.issueType.project == null || !issue.project) {
      issue.issueType.project = {
        id: this.projectSubject.value.id,
        prefix: this.projectSubject.value.prefix,
        name: this.projectSubject.value.name
      }
      issue.project = issue.issueType.project;
    }
    delete issue.values;
    return new Observable<Issue>((observer) => {
      this.apollo
        .mutate({
            mutation: operation.SAVE_ISSUE,
            variables: {issue},
            fetchPolicy: "network-only"
          }
        ).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.saveIssue));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      });
    })
  }

  addComment(comment: Comment, encodedPath: String, uploadings: Uploading[]) {
    comment.user = {id: this.user.id}// TODO: Change to user connected recuperer coté serveur
    return new Observable<Comment[]>(observer => {
      if (uploadings === undefined || uploadings.length == 0) {
        this.apollo.mutate({
          mutation: operation.ADD_COMMENT,
          variables: {comment},
          fetchPolicy: 'network-only'
        }).subscribe((res: any) => {
            observer.next(supprimerTypename(res.data.addComment));
            observer.complete();
          },
          error => {
            observer.error(error);
            observer.complete();
          }
        )
      } else {
        let count = uploadings.length;
        let alredySending = false;
        let filesUploadedsSubject = new BehaviorSubject<Uploaded[]>([]);
        let index = 0;
        this.sendSequentialUpload(index, {}, uploadings, encodedPath, "COMMENTS").subscribe(res => {
          console.debug("fileUploaded");

        });
      }
      // commentaire avec des fichies

    });
  }

  isAllUploaded(uploadings: Uploading[]) {
    if (uploadings === undefined || uploadings.length === 0) {
      return true;
    }
    uploadings.forEach(u => {
      console.debug('uploadings-status', u.status, u);

    })

    let notOk = uploadings.some(u => u.status !== 'success');
    console.debug('isAllUploaded', !notOk);
    return !notOk;
  }

  uploadDocument(document: DocumentApp, encodedPath: String, uploadings: Uploading[], rewRepertoire: string) {
    this.uploadingDocumentSubject = new BehaviorSubject<DocumentApp>(document);
    let index = 0;
    let count = 0;
    return new Observable<DocumentApp>(observer => {
      this.saveDocument(document).subscribe(savedDocument => {
        if (!uploadings || uploadings.length == 0) {
          observer.next(savedDocument);
          observer.complete();
        } else {
          savedDocument.uploadeds = [];
          this.sendSequentialUpload(index, savedDocument, uploadings, encodedPath, rewRepertoire).subscribe(uploades => {
            if (uploades.type === HttpEventType.Response) {
              observer.next(document);
              observer.complete();
            }
          }, er => {
            observer.error(er);
            observer.complete();
          })
        }
      })
    })
  }

  saveDocument(document: DocumentApp) {
    return new Observable<DocumentApp>(observer => {
      this.apollo.mutate({
        mutation: operation.ADD_ADD_DOCUMENT,
        variables: {document},
        fetchPolicy: 'network-only'
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(supprimerTypename(res.data.addDocument)));
          observer.complete();
        },
        error => {
          observer.error(error);
          observer.complete();
        }
      )
    })
  }

  saveUploaded(uploaded: Uploaded) {
    return new Observable<Uploaded>(observer => {
      this.apollo.mutate({
        mutation: operation.SAVE_UPLOADED,
        variables: {uploaded},
        fetchPolicy: 'network-only'
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.saveUploaded));
          observer.complete();
        },
        error => {
          observer.error(error);
          observer.complete();
        }
      )
    })
  }

  sendSequentialUpload(index: number, document: DocumentApp, uploadings: Uploading[], directory: String, newDirectory: String): Observable<any> {

    if (uploadings === undefined || uploadings.length === index) {
      this.uploadingDocumentSubject.next(document);
      return of('Toutes les uploadées');

    }
    let current = uploadings[index];

    if (newDirectory) {
      return this.uploadInNewDirertory(uploadings[index].file, directory, newDirectory.toString(), document.id).pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round((event.loaded / (event.total || 1)) * 100);
            current.status = 'uploading';
            current.progression = progress;
          } else if (event.type === HttpEventType.Response) {
            const uploaded: Uploaded = JSON.parse(event.body);
            current.status = 'success';
            uploaded.document = document;
            index++;
          }
        }),
        catchError((error) => {
          console.error(`Erreur lors de l'upload de ${current.file.name}:`, error);
          current.status = 'error';
          uploadings.shift();
          return of(null);
        }),
        finalize(() => {
          this.sendSequentialUpload(index, document, uploadings, directory, newDirectory).subscribe();
          if (this.isAllUploaded(uploadings)) {
            this.uploadingDocumentSubject.next(document);
          }
        })
      );
    } else {
      return this.upload(current.file, directory, document.id).pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round((event.loaded / (event.total || 1)) * 100);
            console.log(`Progression de ${current.file.name}: ${progress}%`);
            current.status = 'uploading';
            current.progression = progress;
          } else if (event.type === HttpEventType.Response) {
            console.log(`Upload terminé pour ${current.file.name}`);
            const uploaded: Uploaded = JSON.parse(event.body);
            uploaded.document = document;
            current.status = 'success';

            index++;
          }
        }),
        catchError((error) => {
          console.error(`Erreur lors de l'upload de ${current.file.name}:`, error);
          current.status = 'error';
          index++;
          return of(null);
        }),
        finalize(() => {
          this.sendSequentialUpload(index, document, uploadings, directory, newDirectory).subscribe();
        })
      );
    }
  }

  allComment(issueId: number) {
    return new Observable<Comment[]>((observer) => {
      this.apollo
        .query({
          query: operation.ALL_COMMENT,
          variables: {issueId},
          fetchPolicy: 'network-only'
        }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.allComment));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      });
    })
  }


  getValues(issueId: number) {
    return new Observable<CustomFieldValue[]>(observer => {
      this.apollo
        .query({
          query: operation.GET_VALUES,
          variables: {issueId}
        }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.getValues));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      })
    })

  }

  saveValues(v: any) {
    let value = supprimerTypename(v);
    return new Observable<CustomFieldValue[]>(observer => {
      this.apollo
        .mutate({
          mutation: operation.SAVE_VALUE,
          variables: {value}
        }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.saveValue));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      });
    });
  }

  loadDirectory(issueId: number): Observable<Repertoire> {
    let params = new HttpParams().set('issueId', issueId);
    let url = environment.apiURL + "api/load-directory?" + params.toString();
    return this.http
      .get<Repertoire>(url, {withCredentials: true},)
      .pipe(retry(1), catchError(this.handleError));
  }

  handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => {
      return errorMessage;
    });
  }

  ajouterAuGroupe(liste: [any, Issue[]][], groupe: any, issue: Issue): void {
    let groupeExiste = false;
    for (let i = 0; i < liste.length; i++) {
      if (liste[i][0].id === groupe.id) {
        liste[i][1].push(issue);
        groupeExiste = true;
        break;
      }
    }
    if (!groupeExiste) {
      liste.push([groupe, [issue]]);
    }
  }

  generateDownloadUrl(files: any[], directory: String): string {
    let fileNames: string[] = [];
    files.forEach(fn => {
      fileNames.push(fn.absolutePath);
    })
    const queryString = `?fileNames=${fileNames.join(',')}` + "&directory=" + directory;
    return environment.apiURL + `api/download${queryString}`;
  }

  downloadUploadedUrl(uploaded: Uploaded) {
    const queryString = '?fileNames=' + uploaded.encodedPath + '&directory=okay&fileName=' + uploaded.name;
    return environment.apiURL + 'api/download' + queryString;
  }

  upload(file: File, root: String, documentId: number): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest('POST', `${environment.apiURL}api/upload?directory=` + root + "&documentId=" + documentId, formData, {
      reportProgress: true,
      responseType: 'text'
    });
    return this.http.request(req);
  }

  uploadInNewDirertory(file: File, root: String, newDirectory: string, documentId: number): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest('POST', `${environment.apiURL}api/upload?directory=` + root + '&newDirectory=' + newDirectory + "&documentId=" + documentId, formData, {
      reportProgress: true,
      responseType: 'text'
    });
    return this.http.request(req);
  }

  removeElementAtIndex(array: any[], index: number): void {
    if (index > -1) {
      array.splice(index, 1);
    }
  }

  createProjectOrSave(project: any) {
    return new Observable((observer) => {
      this.apollo.mutate({
        mutation: operation.SAVE_PROJECT,
        variables: {project}
      }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.createProjectOrSave));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  getProject(prefix: string) {
    this.loadedWorkspaceSubject.next(false);
    console.debug("loading project " + prefix);
    this.apollo.query({
      query: operation.GET_PROJECT,
      variables: {prefix},
      fetchPolicy: "network-only"
    }).subscribe((res: any) => {
      this.project = stripTypename(res.data.getProject);
      if (this.project) {
        this.loadedWorkspaceSubject.next(true);
        this.projectSubject.next(this.project);
        this.loadListIssueTypeMaster(this.project.id);



      }
    }, err => {
      console.error(err);
    })
  }

  reloadMasterList() {

    this.setIssueMasterCriteria(this.masterListCriteriaSubject.value);
  }

  saveIssueType(issueType: IssueType) {
    return new Observable<IssueType>((observer) => {
      if (issueType.project == undefined) {
        let error: any = {message: "Saving issueType , project es undefined"}
        observer.error(error);
        observer.complete();
        return;
      }
      this.apollo.mutate({
        mutation: operation.SAVE_ISSUE_TYPE,
        variables: {issueType},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.saveIssueType));
          observer.complete();
        }, (err: any) => {
          observer.error(err);
          observer.complete();
        }
      )
    })
  }

  getIssueType(issueTypeId: number) {
    return new Observable<IssueType>((observer) => {
      this.apollo.mutate({
        mutation: operation.GET_ISSUE_TYPE,
        variables: {issueTypeId}
      }).subscribe((res: any) => {
          observer.next(stripTypename(res.data.getIssueType));
          observer.complete();
        }, (err: any) => {
          observer.error(err);
          observer.complete();
        }
      )
    })
  }

  affectWorkFlow(issueType: IssueType) {
    return new Observable<WorkFlow | any>((observer) => {
      this.apollo.mutate({
        mutation: operation.AFFECT_WORKFLOW,
        variables: {issueType}
      }).subscribe((res: any) => {
        observer.next(stripTypename(res.data.affectWorkFlow));
        observer.complete();
      }, (err) => {
        console.error(err);
        observer.error(err);
        observer.complete();
      })
    });
  }

  addStatus(status: Status, workFlow: WorkFlow, issueTypeId: number) {
    return new Observable<WorkFlow | any>((observer) => {
      this.apollo.mutate({
        mutation: operation.ADD_STATUS,
        variables: {status, workFlow},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
        observer.next(stripTypename(res.data.addStatus));
        observer.complete();
      }, (err) => {
        console.error(err);
        observer.error(err);
        observer.complete();
      })
    });
  }


  allProjects() {
    return new Observable<Project[]>((observable) => {
      this.apollo.query({
        query: operation.ALL_PROJECT
      }).subscribe(
        (res: any) => {
          this.projects = supprimerTypename(res.data.allProjects);
          observable.next(this.projects);
          observable.complete();
        }, (error: any) => {
          console.error(error());
          observable.error();
          observable.complete();
        }
      );
    })
  }

  assigneToUser(is: Issue, user: User) {
    let executor:String = this.user.id;
    let issue: any = {
      id: is.id,
      assigne: {id: user.id},
    }
    return new Observable<Issue>((observer) => {
      this.apollo.mutate({
        mutation: operation.ASSIGNE_TO_USER,
        variables: {issue,executor}
      }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.assigneToUser));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      })
    });
  }

  saveWorkFlow(workFlow: WorkFlow) {
    return new Observable<WorkFlow>((observer) => {
      console.info("saving workflow");
      this.apollo.mutate({
        mutation: operation.SAVE_WORK_FLOW,
        variables: {workFlow}
      }).subscribe(
        (res: any) => {
          observer.next(supprimerTypename(res.data.saveWorkFlow));
          observer.complete();
        }, (error: any) => {
          console.error(error);
          observer.error(error);
          observer.complete();
        }
      );
    })
  }

  getWorkFlow(workFlowId: Number) {
    return new Observable<WorkFlow>(observer => {
      this.apollo
        .query({
          query: operation.GET_WORK_FLOW,
          variables: {workFlowId},
          fetchPolicy: "network-only"
        }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.getWorkFlow));
          observer.complete();
        }, error => {
          observer.error(error);
          observer.complete();
        }
      );
    })
  }

  getDistinctWorkflows(issues: Issue[]): WorkFlow[] {
    const workflowMap = new Map<number, WorkFlow>();
    issues.forEach(issue => {
      const workflow = issue.issueType?.curentWorkFlow;
      console.debug(workflow);
      if (workflow && workflow.id != null) {
        if (!workflowMap.has(workflow.id)) {
          workflowMap.set(workflow.id, workflow);
        }
      }
    });
    return Array.from(workflowMap.values());
  }

  workFlowsByProject(projectId: Number) {
    return new Observable<WorkFlow[]>(observer => {
      this.apollo
        .query({
          query: operation.WORK_FLOWS_BY_PROJECT,
          variables: {projectId},
          fetchPolicy: "network-only"
        }).subscribe((res: any) => {
          let wf = supprimerTypename(res.data.workFlowsByProject);
          this.worksFlowsSubject.next(wf);
          observer.next(supprimerTypename(res.data.workFlowsByProject));
          this.worksFlowsSubject.next(wf);
          observer.complete();
        }, error => {
          observer.error(error);
          observer.complete();
        }
      );
    })
  }

  issueByCriteria(criterias: Criteria[]) {
    return new Observable<Issue[]>(observer => {
      this.apollo.query({
        query: ISSUE_BY_CRITERIA,
        variables: {criterias}
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.issueByCriteria));
          observer.complete();
        }, err => {
          observer.error(err);
          observer.complete();
        }
      );
    })
  };

  saveCustomField(customField: CustomField) {
    customField.project = {id: this.project.id}
    return new Observable<CustomField>(observer => {
      this.apollo.mutate(
        {
          mutation: operation.SEVE_CUSTOM_FIELD,
          variables: {customField}
        }
      ).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.saveCustomField));
          observer.complete();
        },
        error1 => {
          observer.error(error1);
          observer.complete;
        })
    });
  }

// TODO : Modifier sur la custom field pour une projet
  allCustomField(projectId: Number) {
    return new Observable<CustomField[]>(observer => {
      this.apollo.query({
        query: ALL_CUSTOM_FIELD,
        variables: {projectId: projectId},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.allCustomField));
          observer.complete();
        },
        error => {
          console.error(error);
          observer.error(error);
          observer.complete();
        })
    })
  }

  getCustomField(id) {
    return new Observable<CustomField>(observer => {
      this.apollo.query({
        query: GET_CUSTOM_FIELD,
        variables: {id},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.getCustomField));
        observer.complete();
      }, error => {
        console.error(error);
        observer.error(error);
        observer.complete();
      })
    })
  }

  useCustomField(usingCustomField: UsingCustomField) {
    return new Observable<UsingCustomField[]>(observer => {
      this.apollo.mutate({
        mutation: USE_CUSTOM_FIELD,
        variables: {usingCustomField},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.useCustomField));
          observer.complete();
        }, error => {
          console.error(error);
          observer.error(error);
          observer.complete();
        }
      )
    })
  }

  unUseCustomField(usingCustomField: UsingCustomField) {
    return new Observable<UsingCustomField[]>(observer => {
      this.apollo.mutate({
        mutation: UN_USE_CUSTOM_FIELD,
        variables: {usingCustomField},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.unUseCustomField));
          observer.complete();
        }, error => {
          console.error(error);
          observer.error(error);
          observer.complete();
        }
      )
    })
  }

  customFieldsByIssueType(issueTypeId: Number) {
    return new Observable<UsingCustomField[]>(observer => {
      this.apollo.query({
        query: CUSTOM_FIELD_BY_ISSUE_TYPE,
        variables: {issueTypeId}
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.customFieldsByIssueType));
          observer.complete();
        }, error => {
          console.error(error);
          observer.error(error);
          observer.complete();
        }
      )
    })
  }

  getConfigProject(projectId: Number) {
    return new Observable<ConfigProject[]>(observer => {
      this.apollo.query({
        query: GET_CONFIG_PROJECT,
        variables: {projectId}
      }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.getConfigProject));
        observer.complete();
      }, error => {
        console.error(error);
        observer.error(error);
        observer.complete();
      })
    })
  }

  setConfigProjectPath(pathSelected: string, projectId) {
    let configProject: any = {}
    configProject.configof = 'config.project.' + projectId + '.path';
    configProject.value = pathSelected;
    this.saveOrUpdateConfig(configProject).subscribe(res => {
    });
  }

  saveOrUpdateConfig(configProject: any) {
    return new Observable<ConfigProject>(observer => {
      this.apollo.mutate({
        mutation: SAVE_CONFIG_PROJECT,
        variables: {configProject},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.saveOrUpdateConfig));
          observer.complete();
        }, error => {

          observer.error(error);
          observer.complete();
        }
      )
    })
  }


  getIssueTypeById(issueTypeId: Number) {
    return new Observable<IssueType>((observer) => {
        this.apollo.query({
          query: GET_ISSUE_TYPE_BY_ID,
          variables: {issueTypeId},
          fetchPolicy: "network-only"
        }).subscribe((res: any) => {
            observer.next(stripTypename(res.data.getIssueTypeById));
            observer.complete();
          }, error => {
            observer.error(error);
            observer.complete();
          }
        );
      }
    );
  }

  affectIssueTypeForParent(childId: Number, parrentId: Number) {
    return new Observable<IssueType>(observer => {
      this.apollo.mutate({
        mutation: AFFECT_ISSUE_TYPE_FOR_PARENT,
        variables: {childId, parrentId},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.affectIssueTypeForParent));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  removeIssueTypeParent(childId: number) {
    return new Observable<IssueType>(observer => {
      this.apollo.mutate({
        mutation: REMOVE_ISSUE_TYPE_PARENT,
        variables: {childId},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.affectIssueTypeForParent));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  listIssueTypeMaster(projectId: Number) {
    return new Observable<IssueType[]>(observer => {
      this.apollo.query({
        query: LIST_ISSUE_TYPE_MASTER,
        variables: {projectId},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.listIssueTypeMaster));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      })
    })
  }
  loadListIssueTypeMaster(projectId:Number){
    this.listIssueTypeMaster(projectId).subscribe(issueTypes=> {
      this.issueTypeMastersListSubject.next(issueTypes);
    })
  }

  listIssueTypeSubtasks(masterId: Number) {
    return new Observable<IssueType[]>(observer => {
      this.apollo.query({
        query: LIST_ISSUE_TYPE_SUBTASKS,
        variables: {masterId},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.listIssueTypeSubtasks));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  getNextKey(issueTypeId: Number) {

    return new Observable<String>(observer => {
      this.apollo.query({
        query: GET_NEXT_KEY,
        variables: {issueTypeId},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.getNextKey));
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  editFilter(event: MouseEvent, customFilter: CustomFilter): Observable<IssueSearchCriteriaInput> {
    return new Observable<IssueSearchCriteriaInput>((observer) => {
      const dialogRef = this.modalService.open(IssueFilterFieldComponent, {
        windowClass: 'custom-dialog',
        backdrop: 'static',
        keyboard: false,
        animation: true
      });
      dialogRef.componentInstance.customFilter = customFilter;

      setTimeout(() => {
        const buttonRect = (event.target as HTMLElement).getBoundingClientRect();
        const dialogElement = document.querySelector('.custom-dialog .modal-dialog') as HTMLElement;

        if (dialogElement) {
          dialogElement.style.position = 'absolute';
          dialogElement.style.left = `${buttonRect.right + 10}px`;
          dialogElement.style.top = `${buttonRect.top - 20}px`;
          dialogElement.style.margin = '0';
          dialogElement.style.transform = 'none';
        }
      }, 0);

      // Gestion des résultats et fermeture du dialogue
      dialogRef.result.then(
        (result) => {
          if (result?.criteria) {
            observer.next(result.criteria);
          } else {
            observer.next(null);
          }
          observer.complete();
        },
        (err) => {
          console.error('Dialogue fermé avec une erreur ou annulé :', err);
          observer.error(err); // Informer l'observable en cas d'erreur
        }
      );
    });
  }

  loadSubtaskAndSet(parentId: Number) {
    this.loadSubtask(parentId).subscribe(
      issues => this.subtaskSubject.next(issues)
    )
  }

  loadSubtask(parentId: Number) {
    return new Observable<Issue[]>(observer => {
      this.apollo.query({
        query: LOAD_SUBTASK,
        variables: {parentId},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.loadSubtask));
        observer.complete();
      }, error => {
        console.error(error);
        observer.complete();
      })
    });
  }

  setMasters(masters: Issue[]) {
    let filtered = masters.filter(m => !m.deleted);
    this.issueMastersListSubject.next(filtered);
  }

  searchIssuesAnSet(criteria: IssueSearchCriteriaInput) {
    this.searchIssues(criteria, criteria.projectId).subscribe(issues => {
      this.setIssues(issues);
    })
  }

  searchIssues(criteria: IssueSearchCriteriaInput, projectId: Number) {
    const startTime = Date.now();
    if (projectId) {
      criteria.projectId = projectId;
      this.loadingListSubtaskSubject.next(true);
    }
    return new Observable<Issue[]>(observer => {
      this.apollo.query({
        query: SEARCH_ISSUES,
        variables: {criteria},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
        const elapsedTime = Date.now() - startTime; // Temps écoulé
        const minLoadTime = 800;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);
        setTimeout(() => {
          this.loadingListSubtaskSubject.next(false);
          observer.next(supprimerTypename(res.data.searchIssues));
          observer.complete();
          observer.complete();
        }, remainingTime);
      }, error => {
        this.loadingListSubtaskSubject.next(false);

      })
    })
  }


  browsIssueMaster(issue: Issue) {
    this.router.navigate(["working/" + this.projectSubject.value.prefix + "/issue/" + issue.issueKey + "/details"])

  }

  allIssueType(projectId: Number) {
    this.apollo.query({
      query: ALL_ISSUE_TYPE,
      variables: {projectId},
      fetchPolicy: "network-only"
    }).subscribe((res: any) => {
      this.issueTypes = supprimerTypename(res.data.allIssueType);
      this.issueTypesSubject.next(this.issueTypes);

    }, error => {
      console.error(error);
    })
  }

  defaultCompare(option1: any, option2) {
    console.debug('comparaison ' + JSON.stringify(option1) + " == " + JSON.stringify(option2));
    return option1.id === option2.id;
  }

  private loadUsers() {
    this.userService.getUsersForProject(this.projectSubject.value.prefix);
  }

  loadIssueType() {
    this.allIssueType(this.project.id);
  }

  findAllStatus() {
    return new Observable<Status[]>((observer) => {
      this.apollo.query({
        query: operation.ALL_STATUS
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.findAllStatus));
          observer.complete();
        }, error => {
          observer.error(error);
          console.error(error);
          observer.complete();
        }
      )
    })
  }

  setIssueMasterCriteria(criteria: IssueSearchCriteriaInput) {
    this.masterListCriteriaSubject.next(criteria);
  }

  openEditIssue(issue: Issue) {
    const dialogRef = this.modalService.open(ViewEditIssueComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.issue = issue;
    dialogRef.result.then((result) => {
    })
  }

  showPlanning(issue: Issue) {
    const dialogRef = this.modalService.open(PlanningIssueComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.issue = issue;
    dialogRef.result.then((result) => {
    })
  }

  ngOnInit(): void {

  }

  setCurrentMasterFilter(filter: CustomFilter) {
    this.masterCurrentMasterFilter = filter;
    this.masterCurrentMasterFilterSubject.next(filter);
  }

  loadProjectList() {
    this.getProjectByUser(this.user?.id);
  }

  getProjectByUser(userId: string) {
    this.apollo.query({
      query: GET_PROJECT_BY_USER,
      variables: {userId},
      fetchPolicy: "network-only"
    }).subscribe((res: any) => {
      let projects: Project[] = supprimerTypename(res.data.getProjectByUser);
      this.projectsSubject.next(projects);
    }, error => {
      console.error(error);
    })
  }

  fileNamesToLink(uploadeds: Set<Uploaded>): String {
    let links: String = "";
    if (uploadeds && uploadeds.size != 0) {
      for (let uploaded of uploadeds) {
        let str = '<label class="tnz-file-tree-item file">' +
          '    <span class="tnz-file-tree-label">' +
          '<a href="' + environment.apiURL + 'api/download?fileNames=' + uploaded.encodedPath + '&directory=metyfona&fileName=' + uploaded.name + '">' + uploaded.name + '</a>';
        '</span>' +
        '</label>';
        links += str;
      }
    }

    return links;
  }

  onFileSelected(event: Event): void {
    let fileCategory;
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileName = file.name;
      const fileExtension = this.getFileExtension(fileName).toLowerCase();

      // Détermine la catégorie du fichier
      if (['pdf'].includes(fileExtension)) {
        fileCategory = 'PDF';
      } else if (['doc', 'docx'].includes(fileExtension)) {
        fileCategory = 'Word';
      } else if (['xls', 'xlsx'].includes(fileExtension)) {
        fileCategory = 'Excel';
      } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'].includes(fileExtension)) {
        fileCategory = 'Image';
      } else {
        fileCategory = 'Type inconnu';
      }
    }
    return fileCategory;
  }

  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
      return '';
    }
    return fileName.substring(lastDotIndex + 1); // Retourne l'extension
  }

  getDocuments(issueId: number, typeDocument: string) {
    console.debug('getDocument');
    return new Observable<DocumentApp[]>(observer => {
      this.apollo.query({
        query: operation.GET_DOCUMENTS,
        variables: {issueId, typeDocument},
        fetchPolicy: 'network-only'
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.getDocuments));
          observer.complete();
        }, error => {
          observer.error(error);
          observer.complete();
        }
      )
    })
  }

  getMaster(criteria: IssueSearchCriteriaInput) {
    this.searchIssues(criteria, null).subscribe(issue => {
      if (issue && issue.length != 0) {
        this.issueMasterSubject.next(issue[0])
      }
    })
  }

  getDomainActivityList() {
    console.debug('getDocument');
    return new Observable<DomainActivity[]>(observer => {
      this.apollo.query({
        query: operation.LIST_ACTIVITY,
        fetchPolicy: 'cache-first'
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.listActivity));
          observer.complete();
        }, error => {
          observer.error(error);
          observer.complete();
        }
      )
    })
  }

  saveCustomFilter(customFilter: CustomFilter) {
    return new Observable<CustomFilter>(observer => {
      this.apollo.mutate({
          mutation: operation.SAVE_CUSTOM_FILTER,
          fetchPolicy: 'network-only',
          variables: {customFilter},
        }
      ).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.saveCustomFilter));
        observer.complete();
      }, error => {
        console.error(error);
        observer.error(error);
        observer.complete();
      })
    })
  }

  getMyFilters(projectId, userId) {

    return new Observable<CustomFilter[]>(observer => {
      this.apollo.query({
          query: operation.GET_MY_FILTERS,
          fetchPolicy: 'network-only',
          variables: {projectId, userId},
        }
      ).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.getMyFilters));
        observer.complete();
      }, error => {
        console.error(error);
        observer.error(error);
        observer.complete();
      })
    })
  }

  loadMyFilters() {
    if (this.project == null || this.user === null)
      return
    let projectId = this.project.id;
    let userId = this.user.id;
    this.getMyFilters(projectId, userId).subscribe(filters => {
      this.myFiltersSubject.next(filters);
      let masterFilter = filters.filter(f => (f.criteria.issueTypeLevels && f.criteria.issueTypeLevels[0] === 'PARENT'));
      this.masterFiltersSubject.next(masterFilter);
      let subtaskFilter = filters.filter(f => (f.criteria.issueTypeLevels && f.criteria.issueTypeLevels[0] === 'SUB_TASK'));
      this.subtaskFiltersSubject.next(subtaskFilter);
    })
  }

  getImageProject(project: Project) {
    if (project && project.imageUrl != null) {
      return environment.apiURL + 'photo/' + project.imageUrl;
    }
    if (project && project.domainActivity) {
      if (project.domainActivity.image) {
        return environment.apiURL + 'photo/' + project.domainActivity.image;
      }
      return this.getImagetP(project.domainActivity.name);
    }
    return 'assets/images/work-space/controle-equipe.jpg';
  }

  getImagetP(domain: string): string {

    switch (domain) {
      case 'TOPO':
        return 'assets/images/work-space/topo-route.jpeg';
      case 'BATIMENT':
        return 'assets/images/work-space/btp.jpg';
      case 'DEV':
        return 'assets/images/work-space/equipe-dev.jpg';
      case 'COMPTABILITE':
        return 'assets/images/work-space/comptabilite.png';
      case 'MEDIA':
        return 'assets/images/work-space/montage-video.png';
      case 'DEFAULT':
        return 'assets/images/work-space/controle-equipe.jpg';
      default:
        return 'assets/images/work-space/controle-equipe.jpg';
    }
  }

  loadAllCustomField() {
    this.allCustomField(this.project.id).subscribe(customFields => {
      this.allCustomFieldSubject.next(customFields);
    });
  }

  getLabelByProject(projectId: Number) {
    this.apollo.query({
        query: operation.GET_LABEL_BY_PROJECT,
        fetchPolicy: "network-only",
        variables: {projectId},
      }
    ).subscribe((res: any) => {
      this.allLabelSubject.next(supprimerTypename(res.data.getLabelByProject));
    }, error => {
      console.error(error);
    })
  }

  saveLabel(label: Label) {
    label.project = {id: this.project.id};
    this.apollo.mutate({
        mutation: operation.SAVE_LABEL,
        fetchPolicy: "network-only",
        variables: {label},
      }
    ).subscribe((res: any) => {
      this.getLabelByProject(this.project.id);
      this.refreshIssueListMasters();
    }, error => {
      console.error(error);
    })
  }

  getIssueById(issueId: number) {
    return new Observable<Issue>(observer => {
      this.apollo.query({
          query: operation.GET_ISSUE_BY_ID,
          fetchPolicy: "network-only",
          variables: {issueId},
        }
      ).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.getIssueById));
        observer.complete();
      }, error => {
        console.error(error);
        observer.error(error);
        observer.complete();
      })
    })

  }

  addLabelInIssue(issueId: number, labelId: Number) {
    return new Observable<IssueLabels[]>(observer => {
      this.apollo.mutate({
          mutation: operation.ADD_LABEL_IN_ISSUE,
          fetchPolicy: "network-only",
          variables: {issueId, labelId},
        }
      ).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.addLabelInIssue));
        observer.complete();
      }, error => {
        console.error(error);
        observer.error(error);
        observer.complete();
      })
    })
  }

  removeLabelInIssue(issueId: number, labelId: Number) {
    return new Observable<IssueLabels[]>(observer => {
      this.apollo.mutate({
          mutation: operation.REMOVE_LABEL_IN_ISSUE,
          fetchPolicy: "network-only",
          variables: {issueId, labelId},
        }
      ).subscribe((res: any) => {
        observer.next(supprimerTypename(res.data.removeLabelInIssue));
        observer.complete();
      }, error => {
        console.error(error);
        observer.error(error);
        observer.complete();
      })
    })
  }

  refreshIssueListMasters() {
    if (this.masterCurrentMasterFilter) {
      this.loadIssueMasters(this.masterCurrentMasterFilterSubject.value.criteria);
    }
  }

  refreshIssueListSubtask() {
    // TODO : Metre ici la refresh List lors d'application du filtre
    if (this.currentSubtaskFilterSubject.value && this.project.id) {
      this.searchIssues(this.masterCurrentMasterFilterSubject.value, this.project.id).subscribe(issues => {
        this.setIssues(issues);
      })
    }
  }

  uploadLogo(file: File): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest('POST', `${environment.apiURL}api/upload/logo`, formData, {
      reportProgress: true,
      withCredentials: true,
      responseType: 'text'
    });
    return this.http.request(req);
  }

  loadSettings() {
    if (this.user === null) {
      return
    }
    let userId = this.user.id;
    this.getSettings(userId).subscribe(settings => {
      this.globalSettingsSubject.next(settings);
    });
  }

  getSettings(userId: String) {
    return new Observable<AppSettings[]>(observer => {
      this.apollo.query({
        query: operation.GET_SETTINGS,
        fetchPolicy: 'network-only',
        variables: {
          userId
        }
      }).subscribe((res: any) => {
          observer.next(res.data.getSettings);
          observer.next(supprimerTypename(res.data.getSettings));
          observer.complete();
        }, error => {
          observer.error(error);
          observer.complete();
        }
      )
    })
  }

  deleteIssue(issueId: Number) {
    this.apollo.mutate({
      mutation: operation.DELETE_ISSUE,
      variables: {issueId},
      fetchPolicy: 'network-only'
    }).subscribe((res: any) => {
        this.refreshIssueListMasters();
      }, error => {
        console.error(error);
        this.refreshIssueListMasters();
      }
    )
  }

  newDocument(typeDocument: String, issue: Issue) {
    return new Observable<DocumentApp>(observer => {
      const dialogRef = this.modalService.open(NewDocumentComponent, {windowClass: "lModal"});
      dialogRef.componentInstance.issue = issue;
      dialogRef.componentInstance.typeDocument = typeDocument;
      dialogRef.result.then((doc) => {
            if (doc != null) {
              observer.next(doc);
            //  this.processDocument(doc)
              observer.complete();
            }
          },
          error => {
            console.error(error);
            observer.error(error);
            observer.complete();
          }
        )
    });

  }

  responseDocument(selectedDocument: DocumentApp, issue) {
    return new Observable<DocumentApp>(observer => {
      const dialogRef = this.modalService.open(NewDocumentComponent, {windowClass: "lModal"});
      dialogRef.componentInstance.typeDocument = 'RESPONSE_DOCUMENT';
      dialogRef.componentInstance.parentDocument = selectedDocument;
      dialogRef.componentInstance.issue = issue;
      dialogRef.result.then((result) => {
        dialogRef.result.then((res: any) => {
            if (res != null) {
              observer.next(supprimerTypename(res.newDocument));
              observer.complete();
            }
          },
          error => {
            console.error(error);
            observer.error(error);
            observer.complete();
          }
        )
      })
    });
  }

  // Ajouter un document au tableau
  addDocument(doc: DocumentApp) {
    const currentDocs = this.documentsSubject.getValue();
    this.documentsSubject.next([...currentDocs, doc]);
  }
  addDocuments(listeDesDocuments: DocumentApp[]) {
    const currentDocs = this.documentsSubject.getValue();
    const newDocs = listeDesDocuments.filter(newDoc =>
      !currentDocs.some(existingDoc => existingDoc.id == newDoc.id)
    );

    if (newDocs.length > 0) {
      this.documentsSubject.next([...currentDocs, ...newDocs]);
    }
  }
  getDocumentsByType(type: string,issueId:Number): DocumentApp[] {
    const currentDocs = this.documentsSubject.getValue();
    return  currentDocs.filter(doc => doc.typeDocument == type && doc.issues.id == issueId) ;

  }
  updateOrAddDocument(updatedDoc: DocumentApp) {
    const currentDocs = this.documentsSubject.getValue();
    const existDoc = this.filterDcumentById(updatedDoc.id);
    if (existDoc) {
      const updatedDocs = currentDocs.map(doc =>
        doc.id === updatedDoc.id ? updatedDoc : doc
      );
      this.documentsSubject.next(updatedDocs);
    } else {
      this.addDocument(updatedDoc);
    }

  }
  filterDcumentById(id: Number): DocumentApp | undefined {
    const currentDocs = this.documentsSubject.getValue();
    return currentDocs.find(doc => doc.id === id);
  }
  processDocumentResponse(response:DocumentApp) {
    console.log("processDocumentResponse",response);

    const parent = this.filterDcumentById(response.parent.id);
      if (parent != null) {
        if (!parent.responses)
          parent.responses = [];
         const responses = [...parent.responses];
         responses.push(response);
         parent.responses = responses;
         this.updateOrAddDocument(parent);
      } else {
        console.log("processResponse-> parent not found");
      }
  }

  processDocument(document: DocumentApp) {
    console.log("processDocument",document);
    if (document.parent && document.parent.id) {
      this.processDocumentResponse(document);
    } else {
      this.addDocument(document);
    }
  }
  processUploaded(uploaded:Uploaded){
    let doc :DocumentApp= this.filterDcumentById(uploaded.document.id);
    if (doc) {
      if (doc.uploadeds && doc.uploadeds.length != 0) {
        let uploades = [... doc.uploadeds, uploaded ];
        doc.uploadeds = uploades;
      } else {
        doc.uploadeds = [uploaded];
      }

      this.updateOrAddDocument(doc);
    }

  }

  loadDocumentById(documentId) {
    return new Observable<DocumentApp>(observer => {
      this.apollo.query({
        query: operation.LOAD_DOCUMENT_BY_ID,
        variables: {documentId},
        fetchPolicy: 'network-only'
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.loadDocumentById));
          observer.complete();
        }, error => {
          console.error(error);
          observer.complete();
        }
      )
    });
  }

  forwardDocument(document: DocumentApp) {
    this.apollo.mutate({
      mutation: operation.FORWARD_DOCUMENT,
      variables: {document},
      fetchPolicy: 'network-only'
    }).subscribe((res: any) => {
      console.info("forward document#"+document.id+ " successfulllll ");
      }, error => {
        console.error("forward document success ",error);
      }
    )
  }

  deleteDocumentById(documentId: number) {
    return new Observable<ResponseApp>(observer => {
      this.apollo.mutate({
        mutation: operation.DELETE_DOCUMENT_BY_ID,
        variables: {documentId},
        fetchPolicy: 'network-only'
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.deleteDocumentById));
          observer.complete();
        }, error => {
          console.error(error);
          observer.complete();
        }
      )
    });
  }

  editDocument(document: DocumentApp) {
    return new Observable(observer => {
      const dialogRef = this.modalService.open(NewDocumentComponent, {windowClass: "xlModal"});
      dialogRef.componentInstance.newDocument = document;
      dialogRef.result.then((result) => {
        observer.next(result);
        observer.complete();
      });
    })

  }

  processDeleteDocument(doc: unknown) {

  }
  createActionAssign(issue:Issue, assign:User){
    let groupe:ActionGroupe = {
      issue:{id:issue.id},
      user:{
        id:this.user.id
      }
    }
    let action:ActionAssigne = new ActionAssigne(groupe,assign);
    this.saveAction(action).subscribe(action =>{
      this.processAction(action);
    })
  }
  createActionStatus(issue:Issue, status:Status){
    let groupe:ActionGroupe = {
      issue:{id:issue.id},
      user:{
        id:this.user.id
      }
    }
    let action:ActionStatus = new ActionStatus(groupe,status);
    this.saveAction(action).subscribe(action =>{
      this.processAction(action);
    })
  }
  saveAction(action:ActionItem) {
    return new Observable<ActionItem>(observer => {
      this.apollo.mutate({
         mutation:operation.SAVE_ACTION,
         variables:{action},
          fetchPolicy: "network-only",
        }
      ).subscribe((res:any) =>{
        observer.next(supprimerTypename(res.data.saveAction));
        observer.complete();
      }, error =>{
         console.log(error);
         observer.error(error);
         observer.complete();
      }
     )
    })
  }
  filterIssueById(issueId:number){
    const masters = this.issueMastersListSubject.getValue();
    return masters.find(master => master.id === issueId);
  }
  processActionAssign(assign:User, issueId){
    const currentMasters = this.issueMastersListSubject.getValue();
    let existIssue:Issue = this.filterIssueById(issueId);
    if (existIssue) {
      existIssue.assigne = assign;
      const updatedMasters = currentMasters.map( master =>
        master.id === existIssue.id ? existIssue : master
      );
      this.issueMastersListSubject.next(updatedMasters);
    }
  }
  processAction(action:ActionItem) {
    switch (action.actionType) {
      case "ASSIGN":{
        let assign:ActionAssigne  = action as ActionAssigne;
        this.processActionAssign(assign.assigne,assign.actionGroupe.issue.id);
        break;
      }
      case "STATUS":{
        let actionStatus :ActionStatus = action as ActionStatus;
        this.processActionStatus(actionStatus.status,actionStatus.actionGroupe.issue.id);
      }
    }
  }

  private processActionStatus(status: Status, issueId: number) {
    const currentMasters = this.issueMastersListSubject.getValue();
    let existIssue:Issue = this.filterIssueById(issueId);
    if (existIssue) {
      existIssue.status = status;
      const updatedMasters = currentMasters.map( master =>
        master.id === existIssue.id ? existIssue : master
      );
      this.issueMastersListSubject.next(updatedMasters);
    }
  }


  nextImage(image:Repertoire) {
    this.slidingImageSubject.next(image);
  }
  slideSuivanteImage(action:string) {
    let currentSlide = this.slidingImageSubject.value;
    if (currentSlide == null)
      return;
    this.http.get(environment.apiURL+"api/slide-next?path="+currentSlide.path+"&numero="+currentSlide.type+"&action="+action).subscribe(res => {
      console.log('okaaay ');
    });
  }
}
