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
  Criteria, CustomField, UsingCustomField, CustomFieldValue, ConfigProject, GroupeUser, Uploading, Uploaded, DocumentApp
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
import {Filter, IssueSearchCriteriaInput} from "../type/issue-search-criteria.util";
import {ActivatedRoute, Router} from "@angular/router";
import {UserService} from "./user.service";
import {NewIssueComponent} from "../pages/private/project/modal/new-issue/new-issue.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueFilterFieldComponent} from "../common/issue-filter-field/issue-filter-field.component";
import {ViewEditIssueComponent} from "../pages/private/project/modal/view-edit-issue/view-edit-issue.component";
import {PlanningIssueComponent} from "../pages/private/project/modal/planning-issue/planning-issue.component";
import {AuthService} from "./auth.service";
import {id} from "@swimlane/ngx-charts";
import {List} from "gojs";

@Injectable({
  providedIn: 'root',
})
export class IssueService implements OnInit{
  projects: Project[] = [];
  project: Project | null = null;
  issueTypes:IssueType[]=[];
  user:User | undefined;
  private subtaskSubject= new BehaviorSubject<Issue[]>([]);
  private issueMastersSubject = new BehaviorSubject<Issue[]>([]);
  private projectSubject = new BehaviorSubject<Project>(undefined);
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  private worksFlowsSubject = new BehaviorSubject<WorkFlow[]>([]);
  private masterCriteriaSubject = new BehaviorSubject<IssueSearchCriteriaInput>({});
  workFlows$ = this.worksFlowsSubject.asObservable();
  subtask$ = this.subtaskSubject.asObservable();

  issueMasters$ = this.issueMastersSubject.asObservable();
  project$ = this.projectSubject.asObservable();
  projects$ = this.projectsSubject.asObservable();
  masterCriteria$ = this.masterCriteriaSubject.asObservable();

  private issuesSubject = new BehaviorSubject<Issue[]>([]);
  issues$ = this.issuesSubject.asObservable();
  setIssues(issues: Issue[]) {
    this.issuesSubject.next(issues);
  }
  setSubtask(issues:Issue[]){
    this.subtaskSubject.next(issues);
  }
  // Exposed as an observable for components to subscribe

  constructor(private http: HttpClient,
              private apollo: Apollo,
              private router: Router,
              private userService:UserService,
              private modalService:NgbModal,
              private authService:AuthService
  ) {
    const initialProject: Project = null;
    this.authService.connectedUser$.subscribe(user => {
      this.user = user;
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
    return new Observable<Issue[]>(observer=> {
      this.apollo
        .query({
          query: operation.ALL_ISSUE,
        }).subscribe((res:any)=>{
           observer.next(supprimerTypename(res.data.allIssue));
           this.setIssues(supprimerTypename(res.data.allIssue));
           observer.complete();
        },error =>{
          observer.error(error);
          observer.complete();
      })
    })

  }

  saveIssue(issue: any) {
    if (issue.issueType.project == null || issue.project ) {
      issue.issueType.project = {
        id:this.projectSubject.value.id,
        prefix:this.projectSubject.value.prefix,
        name:this.projectSubject.value.name
      }
      issue.project = issue.issueType.project;
    }
    delete issue.values;
   return new Observable<Issue>((observer) => {
     this.apollo
       .mutate({
           mutation: operation.SAVE_ISSUE,
           variables: {issue},
           fetchPolicy:"network-only"
         }
       ).subscribe( (res:any)=>{
         observer.next(supprimerTypename(res.data.saveIssue));
         observer.complete();
     },error=>{
         observer.error(error);
         observer.complete();
     });
   })
  }

  addComment(comment: Comment, encodedPath:String,uploadings:Uploading[]) {
    comment.user = {id:this.user.id}// TODO: Change to user connected recuperer coté serveur
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

        this.sendSequentialUpload({},uploadings,encodedPath,"COMMENTS").subscribe(res => {
          console.debug("fileUploaded");

        });
      }
      // commentaire avec des fichies

    });
  }
  uploadDocument(document:DocumentApp , encodedPath:String, uploadings:Uploading[], rewRepertoire:string) {
   return new Observable<DocumentApp>(observer => {
        this.saveDocument(document).subscribe( savedDocument => {
          if (!uploadings || uploadings.length == 0) {
            observer.next(savedDocument);
            observer.complete();
          } else {
            this.sendSequentialUpload(savedDocument,uploadings,encodedPath,rewRepertoire).subscribe(uploades => {
              if (uploades.type === undefined)
                alert(JSON.stringify(uploades));
              observer.next(savedDocument);
              observer.complete();
            },er => {
              observer.error(er);
              observer.complete();
            })
          }
        })
   })
  }
  saveDocument(document:DocumentApp) {
    return new Observable<DocumentApp>(observer => {
      this.apollo.mutate({
        mutation: operation.ADD_ADD_DOCUMENT,
        variables: {document},
        fetchPolicy: 'network-only'
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.addDocument));
          observer.complete();
        },
        error => {
          observer.error(error);
          observer.complete();
        }
      )
    })
  }
  saveUploaded(uploaded:Uploaded) {
    return new Observable<DocumentApp>(observer => {
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
  sendSequentialUpload(document:DocumentApp,uploadings: Uploading[] ,directory: String,newDirectory:String): Observable<any> {
    console.debug("Saved document",document);

    if (uploadings === undefined || uploadings.length === 0) {
      console.debug("Toutes les uploadées");
      return of('Toutes les uploadées');
    }
    let current = uploadings[0];

    if (newDirectory) {
      return this.uploadInNewDirertory(current.file,directory,newDirectory.toString()).pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round((event.loaded / (event.total || 1)) * 100);
            console.log(`Progression de ${current.file.name}: ${progress}%`);
            current.status = 'uploading';
            current.progression = progress;
          } else if (event.type === HttpEventType.Response) {
            console.log(`Upload terminé pour ${current.file.name}`);
            const uploaded:Uploaded = JSON.parse(event.body);
            uploaded.document = document;
            console.debug('uploaded to save',uploaded);

            this.saveUploaded(uploaded).subscribe(() => {
              current.status = 'success';
              uploadings.shift();
              console.log("ater shift",uploadings);
            });
          }
        }),
        catchError((error) => {
          console.error(`Erreur lors de l'upload de ${current.file.name}:`, error);
          current.status = 'error';
          uploadings.shift();
          return of(null);
        }),
        finalize(() => {
          this.sendSequentialUpload(document,uploadings,directory,newDirectory).subscribe();
        })
        );
    } else {
      return this.upload(current.file,directory).pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round((event.loaded / (event.total || 1)) * 100);
            console.log(`Progression de ${current.file.name}: ${progress}%`);
            current.status = 'uploading';
            current.progression = progress;
          } else if (event.type === HttpEventType.Response) {
            console.log(`Upload terminé pour ${current.file.name}`);
            const uploaded:Uploaded = JSON.parse(event.body);
            uploaded.document = document;
            console.debug('uploaded to save',uploaded);
            this.saveUploaded(uploaded).subscribe(() => {
              current.status = 'success';
              uploadings.shift();
            });
          }
        }),
        catchError((error) => {
          console.error(`Erreur lors de l'upload de ${current.file.name}:`, error);
          current.status = 'error';
          uploadings.shift();
          return of(null);
        }),
        finalize(() => {
           this.sendSequentialUpload(document,uploadings,directory,newDirectory).subscribe();
        })
        );
    }
  }

  allComment(issueId: number) {
    return new Observable<Comment[]>((observer)=>{
      this.apollo
        .query({
          query: operation.ALL_COMMENT,
          variables: {issueId},
          fetchPolicy:'network-only'
        }).subscribe((res:any)=>{
          observer.next(supprimerTypename(res.data.allComment));
          observer.complete();
      },error=>{
          observer.error(error);
          observer.complete();
      });
    })
  }


  getValues(issueId: number) {
    return new Observable<CustomFieldValue[]>(observer=> {
      this.apollo
        .query({
          query: operation.GET_VALUES,
          variables: {issueId}
        }).subscribe((res:any)=>{
          observer.next(supprimerTypename(res.data.getValues));
          observer.complete();
      },error=>{
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

  upload(file: File, root: String): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest('POST', `${environment.apiURL}api/upload?directory=` + root, formData, {
      reportProgress: true,
      responseType: 'text'
    });
    return this.http.request(req);
  }
  uploadInNewDirertory(file: File, root: String,newDirectory:string): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest('POST', `${environment.apiURL}api/upload?directory=` + root+'&newDirectory='+newDirectory, formData, {
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
    console.debug("loading project "+prefix);
    this.apollo.query({
      query: operation.GET_PROJECT,
      variables: {prefix},
      fetchPolicy:"network-only"
    }).subscribe((res: any) => {
      this.project = stripTypename(res.data.getProject);
      if (this.project) {
        console.debug(this.project);
        this.projectSubject.next(this.project);
        this.loadIssueMasterByProject(this.projectSubject.value.id);
        this.workFlowsByProject(this.projectSubject.value.id).subscribe();
        this.loadUsers();
        this.loadIssueType();
      }
    }, err => {
      console.error(err);
    })
  }

  saveIssueType(issueType: IssueType) {
    return new Observable<IssueType>((observer) => {
      if (issueType.project == undefined ){
       let  error :any = {message:"Saving issueType , project es undefined"}
        observer.error(error);
       observer.complete();
       return;
      }
      this.apollo.mutate({
        mutation: operation.SAVE_ISSUE_TYPE,
        variables: {issueType},
        fetchPolicy:"network-only"
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

  assigneToUser(is: Issue,user:User) {
    let issue :any= {
      id:is.id,
      assigne:{id:user.id},
    }
    return new Observable<Issue>((observer) => {
      this.apollo.mutate({
        mutation: operation.ASSIGNE_TO_USER,
        variables: {issue}
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
          variables:{workFlowId},
          fetchPolicy:"network-only"
        }).subscribe((res:any)=>{
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
          variables:{projectId},
          fetchPolicy:"network-only"
        }).subscribe((res:any)=>{
         let wf =  supprimerTypename(res.data.workFlowsByProject);
         let project = {...this.projectSubject.value};
         project.workFlows = wf;
         this.projectSubject.next(project);
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
  allCustomField() {
    return new Observable<CustomField[]>(observer => {
      this.apollo.query({
        query: ALL_CUSTOM_FIELD,
        fetchPolicy:"network-only"
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
            observer.next(stripTypename( res.data.getIssueTypeById));
            observer.complete();
          }, error => {
            observer.error(error);
            observer.complete();
          }
        );
      }
    );
  }
  affectIssueTypeForParent(childId:Number, parrentId:Number){
    return new Observable<IssueType>(observer => {
      this.apollo.mutate({
        mutation:AFFECT_ISSUE_TYPE_FOR_PARENT,
        variables:{childId,parrentId},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.affectIssueTypeForParent));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  removeIssueTypeParent(childId: number) {
    return new Observable<IssueType>(observer => {
      this.apollo.mutate({
        mutation:REMOVE_ISSUE_TYPE_PARENT,
        variables:{childId},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.affectIssueTypeForParent));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  listIssueTypeMaster(projectId: Number) {
    return new Observable<IssueType[]>(observer => {
      this.apollo.query({
        query:LIST_ISSUE_TYPE_MASTER,
        variables:{projectId},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.listIssueTypeMaster));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  listIssueTypeSubtasks(masterId: Number) {
    return new Observable<IssueType[]>(observer => {
      this.apollo.query({
        query:LIST_ISSUE_TYPE_SUBTASKS,
        variables:{masterId},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.listIssueTypeSubtasks));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  getNextKey(issueTypeId: Number) {

    return new Observable<String>(observer => {
      this.apollo.query({
        query:GET_NEXT_KEY,
        variables:{issueTypeId},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.getNextKey));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  getIssue(issueKey: string) {
    return new Observable<Issue>(observer => {
      this.apollo.query({
        query:GET_ISSUE,
        variables:{issueKey},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.getIssue));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }
  editFilter(issueCriteria:IssueSearchCriteriaInput) {
    return new Observable<IssueSearchCriteriaInput>((observer) => {
      const dialogRef = this.modalService.open(IssueFilterFieldComponent);
      dialogRef.componentInstance.issueCriteria = issueCriteria;
      dialogRef.result.then((result) => {
        observer.next(result.criteria);
        observer.complete();
      }, err => {
        observer.complete();
      })
    });
  }
  loadSubtaskAndSet(parentId: Number) {
      this.loadSubtask(parentId).subscribe(
       issues =>  this.subtaskSubject.next(issues)
      )
  }
  loadSubtask(parentId: Number) {
    return new Observable<Issue[]>(observer => {
      this.apollo.query({
        query:LOAD_SUBTASK,
        variables:{parentId},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.loadSubtask));
        observer.complete();
      },error => {
        console.error(error);
        observer.complete();
      })
    });
  }
  loadIssueMasterByProject(projectId: Number) {
      this.apollo.query({
        query:LOAD_ISSUE_MASTER_BY_PROJECT,
        variables:{projectId},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        this.setMasters(supprimerTypename(res.data.loadIssueMasterByProject));
      },error => {
        console.error(error);
      })
  }
  setMasters(masters:Issue[]){
    this.issueMastersSubject.next(masters);
  }
  searchIssuesAnSet(criteria: IssueSearchCriteriaInput) {
   this.searchIssues(criteria).subscribe(issues => {
     this.setIssues(issues);
   })
  }
  searchIssues(criteria: IssueSearchCriteriaInput) {
    criteria.projectId = this.projectSubject.value?.id;
    return new Observable<Issue[]>(observer => {
      this.apollo.query({
        query:SEARCH_ISSUES,
        variables:{criteria},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.searchIssues));
        observer.complete();
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }


  browsIssueMaster(issue: Issue) {
    this.router.navigate(["private/working/"+this.projectSubject.value.prefix+"/issue/"+issue.issueKey+"/details"])

  }
  allIssueType(projectId:Number) {
    return new Observable<Issue[]>(observer => {
      this.apollo.query({
        query:ALL_ISSUE_TYPE,
        variables:{projectId},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        this.issueTypes = supprimerTypename(res.data.allIssueType);
        let project:Project = {...this.projectSubject.value}
        project.issueTypes = this.issueTypes;
        this.projectSubject.next(project);
        observer.next(supprimerTypename(res.data.allIssueType));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  defaultCompare(option1:any,option2){
    console.debug('comparaison '+JSON.stringify(option1) + " == "+JSON.stringify(option2));
    return option1.id === option2.id;
  }

  private loadUsers() {
    this.userService.getUsers(this.projectSubject.value.prefix);
  }

  private loadIssueType() {
    this.allIssueType(this.projectSubject.value.id);
  }

  findAllStatus() {
    return new Observable<Status[]>((observer)=> {
      this.apollo.query({
        query:operation.ALL_STATUS
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.findAllStatus));
        observer.complete();
      }, error =>{
        observer.error(error);
        console.error(error);
        observer.complete();
      }
      )
    })
  }
  setIssueMasterCriteria(criteria:IssueSearchCriteriaInput){
    this.masterCriteriaSubject.next(criteria);
  }
  openEditIssue(issue:Issue){
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

  getProjectByUser(userId: string) {
      this.apollo.query({
        query:GET_PROJECT_BY_USER,
        variables:{userId},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        let projects:Project[] = supprimerTypename(res.data.getProjectByUser);
        this.projectsSubject.next(projects);
      },error => {
        console.error(error);
      })
  }

  fileNamesToLink(uploadeds: Set<Uploaded>):String {
    let links:String = "" ;
    if (uploadeds && uploadeds.size != 0){
      for (let uploaded of uploadeds) {
        let str = '<label class="tnz-file-tree-item file">' +
          '    <span class="tnz-file-tree-label">' +
                   '<a href="'+environment.apiURL +'api/download?fileNames='+uploaded.encodedPath+'&directory=metyfona&fileName='+uploaded.name+'">'+uploaded.name+'</a>';
          '</span>' +
          '</label>';
          links += str;
      }
    }

    return links;
  }
  onFileSelected(event: Event): void {
    let fileCategory ;
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
      }
      else if (['xls', 'xlsx'].includes(fileExtension)) {
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
    return new Observable<DocumentApp[]>(observer=>{
      this.apollo.query({
        query:operation.GET_DOCUMENTS,
        variables:{issueId,typeDocument},
        fetchPolicy:'network-only'
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.getDocuments));
        observer.complete();
      },error=> {
        observer.error(error);
        observer.complete();
        }
        )
    })
  }
}
