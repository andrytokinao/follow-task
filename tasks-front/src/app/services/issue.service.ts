import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest} from '@angular/common/http';
import {observable, Observable, throwError} from 'rxjs';
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
  Criteria, CustomField, UsingCustomField, CustomFieldValue, ConfigProject, GroupeUser
} from "../type/issue";
import {Apollo} from "apollo-angular";
import * as operation from "../type/graphql.operations";
import {stripTypename} from "@apollo/client/utilities";
import {error} from "@angular/compiler-cli/src/transformers/util";
import {
  AFFECT_ISSUE_TYPE_FOR_PARENT,
  ALL_CUSTOM_FIELD,
  CUSTOM_FIELD_BY_ISSUE_TYPE,
  GET_CONFIG_PROJECT,
  GET_CUSTOM_FIELD,
  GET_GROUPE_USER_FOR_PROJECT, GET_ISSUE,
  GET_ISSUE_TYPE_BY_ID,
  GET_NEXT_KEY,
  ISSUE_BY_CRITERIA, LIST_ISSUE_TYPE_MASTER, LIST_ISSUE_TYPE_SUBTASKS, LOAD_SUBTASK,
  REMOVE_ISSUE_TYPE_PARENT,
  SAVE_CONFIG,
  SAVE_CONFIG_PROJECT,
  supprimerTypename,
  UN_USE_CUSTOM_FIELD,
  USE_CUSTOM_FIELD
} from "../type/graphql.operations";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class IssueService {
  projects: Project[] = [];
  project: Project | null = null;

  constructor(private http: HttpClient, private apollo: Apollo) {
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

  getWorkFlow(projet: string) {
    return this.apollo
      .query({
        query: operation.ALL_STATUS,
      });
  }

  getIssues(projet: String | undefined) {
    return new Observable<Issue[]>(observer=> {
      this.apollo
        .query({
          query: operation.ALL_ISSUE,
        }).subscribe((res:any)=>{
           observer.next(res.data.allIssue);
           observer.complete();
        },error =>{
          observer.error(error);
          observer.complete();
      })
    })

  }

  saveIssue(issue: any) {
   return new Observable<Issue>((observer) => {
     this.apollo
       .mutate({
           mutation: operation.SAVE_ISSUE,
           variables: {issue}
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

  addComment(comment: Comment) {
    return new Observable<Comment[]>(observer => {
      return this.apollo.mutate({
        mutation: operation.ADD_COMMENT,
        variables: {comment}
      }).subscribe((res:any)=>{
        observer.next(res.data.addComment);
        observer.complete();
      },
        error => {
         observer.error(error);
         observer.complete();
        }
        )
    })
  }


  allComment(issueId: number) {
    return new Observable<Comment[]>((observer)=>{
      this.apollo
        .query({
          query: operation.ALL_COMMENT,
          variables: {issueId}
        }).subscribe((res:any)=>{
          observer.next(res.data.allComment);
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
          observer.next(res.data.getValues);
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
    return environment.apiURL + `/api/download${queryString}`;
  }

  upload(file: File, dir: string): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest('POST', `${environment.apiURL}api/upload?directory=` + dir, formData, {
      reportProgress: true,
      responseType: 'text'
    });
    return this.http.request(req);
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
    return new Observable<any>((observer) => {
      if (this.project == null || this.project.prefix == prefix) {
        this.apollo.query({
          query: operation.GET_PROJECT,
          variables: {prefix}
        }).subscribe((res: any) => {
          this.project = stripTypename(res.data.getProject);
          if (this.project) {
            observer.next(this.project);
          }
          observer.complete();
        }, err => {
          observer.error(err);
          observer.complete();
        })
      } else {
        observer.next(this.project);
        observer.complete();
      }
    })
  }

  saveIssueType(issueType: IssueType) {
    return new Observable<any>((observer) => {
      this.apollo.mutate({
        mutation: operation.SAVE_ISSUE_TYPE,
        variables: {issueType},
        fetchPolicy:"network-only"
      }).subscribe((res: any) => {
          if (this.project) {
            this.project.issueTypes.push(supprimerTypename(res.data.saveIssueType));
          } else {
            this.project = issueType.project;
          }
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

  assigneToUser(issue: Issue) {
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
      alert(JSON.stringify(res));
    });
  }

  saveOrUpdateConfig(configProject: any) {
    return new Observable<ConfigProject>(observer => {
      this.apollo.mutate({
        mutation: SAVE_CONFIG_PROJECT,
        variables: {configProject},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
          alert(JSON.stringify(res));
          observer.next(supprimerTypename(res.data.saveOrUpdateConfig));
          observer.complete();
        }, error => {
          alert(JSON.stringify(error));

          observer.error(error);
          observer.complete();
        }
      )
    })
  }

  getGroupeUserForProject(projectId: Number) {
    return new Observable<GroupeUser[]>((observer) => {
      this.apollo.query({
        query: GET_GROUPE_USER_FOR_PROJECT,
        variables: {projectId},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
          observer.next(supprimerTypename(res.data.getGroupeUserForProject));
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

  loadSubtask(parentId: number) {
    return new Observable<Issue[]>(observer => {
      this.apollo.query({
        query:LOAD_SUBTASK,
        variables:{parentId},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.loadSubtask));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }
}
