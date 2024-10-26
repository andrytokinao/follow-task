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
  ALL_CUSTOM_FIELD,
  CUSTOM_FIELD_BY_ISSUE_TYPE, GET_CONFIG_PROJECT, GET_CUSTOM_FIELD, GET_GROUPE_USER_FOR_PROJECT,
  ISSUE_BY_CRITERIA,
  SAVE_CONFIG, SAVE_CONFIG_PROJECT,
  supprimerTypename, UN_USE_CUSTOM_FIELD,
  USE_CUSTOM_FIELD
} from "../type/graphql.operations";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class IssueService {
  projects:Project[] = [];
  project:Project | null = null;

  constructor(private http: HttpClient, private apollo: Apollo) {}
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
  getWorkFlowOld(project:string): Observable<Status[]> {
    let url = "assets/workflow-prj1.json";
    return this.http
      .get<Status[]>(url)
      .pipe(retry(1), catchError(this.handleError));
  }
  getWorkFlow(projet:string) {
    return this.apollo
      .query({
        query: operation.ALL_STATUS ,
      });
  }
  getIssues(projet:String | undefined) {
    return this.apollo
      .query({
        query: operation.ALL_ISSUE ,
      });
  }
  saveIssue(issue:any){
    return this.apollo
      .mutate({
        mutation:operation.SAVE_ISSUE,
        variables:{issue}
        }
      );
  }
  addComment(comment:Comment){
    return this.apollo.mutate({
      mutation:operation.ADD_COMMENT,
      variables:{comment}
    });
  }


  allComment(issueId:number){
    return this.apollo
      .query({
        query: operation.ALL_COMMENT ,
        variables:{issueId}
      });
  }


  getValues(issueId:number){
    return this.apollo
      .query({
        query: operation.GET_VALUES ,
        variables:{issueId}
      });
  }
  saveValues(v:any){
    let value = supprimerTypename(v);
    return new Observable<CustomFieldValue[]>(observer=> {
      this.apollo
        .mutate({
          mutation: operation.SAVE_VALUE,
          variables:{value}
        }).subscribe((res:any)=>{
            observer.next(res.data.saveValue());
            observer.complete();
        }, error => {
          observer.error(error);
          observer.complete();
      });
    });
  }
  loadDirectory(issueId:number): Observable<Repertoire> {
    let params = new HttpParams().set('issueId', issueId);
    let url =  environment.apiURL+"api/load-directory?"+params.toString();
     return this.http
      .get<Repertoire>(url,{withCredentials:true },)
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
    return  environment.apiURL+`/api/download${queryString}`;
  }
  upload(file: File, dir:string): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest('POST', `${ environment.apiURL}api/upload?directory=`+dir, formData, {
      reportProgress: true,
      responseType: 'text'
    });
    return this.http.request(req);
  }
  createProjectOrSave(project: any) {
    return new Observable((observer)=>{
      this.apollo.mutate({
        mutation:operation.SAVE_PROJECT,
        variables: {project}
      }).subscribe((res:any)=>{
        observer.next(res.data.createProjectOrSave );
        observer.complete();
      },error=>{
        observer.error(error);
        observer.complete();
      })
    })
  }
  getProject(prefix:string){
    return new Observable<any>((observer)=>{
      if(this.project == null || this.project.prefix==prefix) {
        this.apollo.query({
          query:operation.GET_PROJECT,
          variables:{prefix}
        }).subscribe((res:any)=>{
          this.project = stripTypename(res.data.getProject);
          if(this.project) {
            observer.next(this.project);
          }
          observer.complete();
        },err=>{
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
    return new Observable<any>((observer)=>{
      this.apollo.mutate({
        mutation: operation.SAVE_ISSUE_TYPE,
        variables: {issueType}
      }).subscribe((res:any)=>{
       if(this.project){
         this.project.issueTypes.push(supprimerTypename(res.data.saveIssueType));
       }else {
         this.project = issueType.project;
       }
        observer.next(res.data.saveIssueType);
        observer.complete();
      },(err:any)=>{
        observer.error(err);
        observer.complete();
        }
      )
    })
  }
  getIssueType(issueTypeId: number) {
    return new Observable<IssueType>((observer)=>{
      this.apollo.mutate({
        mutation: operation.GET_ISSUE_TYPE,
        variables: {issueTypeId}
      }).subscribe((res:any)=>{
        observer.next(stripTypename(res.data.getIssueType));
        observer.complete();
        },(err:any)=>{
          observer.error(err);
          observer.complete();
        }
      )
    })
  }
  affectWorkFlow(issueType: IssueType) {
    return new Observable<WorkFlow|any>((observer)=>{
      this.apollo.mutate({
        mutation: operation.AFFECT_WORKFLOW,
        variables: {issueType}
      }).subscribe((res:any)=>{
        observer.next(stripTypename(res.data.affectWorkFlow));
        observer.complete();
      },(err)=>{
        console.error(err);
        observer.error(err);
        observer.complete();
      })
    });
  }
  addStatus(status: Status, workFlow:WorkFlow, issueTypeId:number) {
    return new Observable<WorkFlow|any>((observer)=>{
      this.apollo.mutate({
        mutation: operation.ADD_STATUS,
        variables: {status,workFlow},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(stripTypename(res.data.addStatus));
        observer.complete();
      },(err)=>{
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
          this.projects = res.data.allProjects;
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
  assigneToUser(issue:Issue) {
    return new Observable<Issue>((observer)=>{
       this.apollo.mutate({
         mutation:operation.ASSIGNE_TO_USER,
         variables:{issue}
       }).subscribe((res:any)=>{
          observer.next(res.data.assigneToUser);
          observer.complete();
      },error => {
         observer.error(error);
         observer.complete();
       })
    });
  }

  saveWorkFlow(workFlow: WorkFlow) {
    return new Observable<WorkFlow>((observer)=> {
      console.info("saving workflow");
      this.apollo.mutate({
        mutation: operation.SAVE_WORK_FLOW,
        variables:{workFlow}
      }).subscribe(
        (res: any) => {
          observer.next(res.data.saveWorkFlow);
          observer.complete();
        }, (error: any) => {
          console.error(error);
          observer.error(error);
          observer.complete();
        }
      );
    })
  }
  issueByCriteria(criterias:Criteria[]) {
    return new Observable<Issue[]>(observer =>{
      this.apollo.query({
        query:ISSUE_BY_CRITERIA,
        variables:{criterias}
      }).subscribe((res:any) =>{
        observer.next(supprimerTypename(res.data.issueByCriteria));
        observer.complete();
      },err =>{
         observer.error(err);
         observer.complete();
        }
        );
    })
  };
  saveCustomField(customField:CustomField) {
    return new Observable<CustomField[]>(observer => {
      this.apollo.mutate(
        {
           mutation:operation.SEVE_CUSTOM_FIELD,
           variables:{customField}
        }
      ).subscribe((res:any) => {
          observer.next(res.data.saveCustomField);
          observer.complete();
        },
        error1 => {
          observer.error(error1);
          observer.complete;
        })
    });
  }
  allCustomField(){
    return new Observable<CustomField[]>(observer =>{
      this.apollo.query({
        query:ALL_CUSTOM_FIELD
      }).subscribe((res:any) =>{
        observer.next(res.data.allCustomField);
        observer.complete();
      },
        error=>{
        console.error(error);
        observer.error(error);
        observer.complete();
        })
    })

  }
  getCustomField(id) {
    return new Observable<CustomField>(observer =>{
      this.apollo.query({
        query:GET_CUSTOM_FIELD,
        variables:{id},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(res.data.getCustomField);
        observer.complete();
      },error => {
        console.error(error);
        observer.error(error);
        observer.complete();
      })
    })
  }
  useCustomField(usingCustomField:UsingCustomField) {
    return new Observable<UsingCustomField[]>(observer => {
      this.apollo.mutate({
        mutation:USE_CUSTOM_FIELD,
        variables:{usingCustomField},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(res.data.useCustomField);
        observer.complete();
      },error => {
          console.error(error);
          observer.error(error);
          observer.complete();
        }
        )
    })
  }
  unUseCustomField(usingCustomField:UsingCustomField) {
    return new Observable<UsingCustomField[]>(observer => {
      this.apollo.mutate({
        mutation:UN_USE_CUSTOM_FIELD,
        variables:{usingCustomField},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
          observer.next(res.data.unUseCustomField);
          observer.complete();
        },error => {
          console.error(error);
          observer.error(error);
          observer.complete();
        }
      )
    })
  }
  customFieldsByIssueType(issueTypeId:Number) {
    return new Observable<UsingCustomField[]>(observer => {
      this.apollo.query({
        query:CUSTOM_FIELD_BY_ISSUE_TYPE,
        variables:{issueTypeId}
      }).subscribe((res:any)=>{
          observer.next(res.data.customFieldsByIssueType);
          observer.complete();
        },error => {
          console.error(error);
          observer.error(error);
          observer.complete();
        }
      )
    })
  }
  getConfigProject(projectId:Number) {
    return new Observable<ConfigProject[]>(observer => {
      this.apollo.query({
        query:GET_CONFIG_PROJECT,
        variables:{projectId}
      }).subscribe((res:any)=>{
        observer.next(res.data.getConfigProject);
        observer.complete();
      },error => {
        console.error(error);
        observer.error(error);
        observer.complete();
      })
    })
  }

  setConfigProjectPath(pathSelected: string, projectId) {
    let configProject:any = {}
    configProject.configof = 'config.project.'+projectId+'.path';
    configProject.value = pathSelected;
    this.saveOrUpdateConfig(configProject).subscribe(res=>{
      alert(JSON.stringify(res));
    });
  }
  saveOrUpdateConfig(configProject:any){
    return new Observable<ConfigProject>(observer=> {
      this.apollo.mutate({
        mutation:SAVE_CONFIG_PROJECT,
        variables:{configProject},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        alert(JSON.stringify(res));
        observer.next(res.data.saveOrUpdateConfig);
        observer.complete();
      },error => {
          alert(JSON.stringify(error));

          observer.error(error);
        observer.complete();
        }
        )
    })
  }
  getGroupeUserForProject(projectId:Number){
    return new Observable<GroupeUser[]>((observer)=>{
      this.apollo.query({
        query:GET_GROUPE_USER_FOR_PROJECT,
        variables:{projectId},
        fetchPolicy:"network-only"
      }).subscribe((res:any)=>{
        observer.next(res.data.getGroupeUserForProject);
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
        }
      )
    })
  }
}
