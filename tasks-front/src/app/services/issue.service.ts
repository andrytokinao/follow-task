import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {Issue, Status, User, Comment, Repertoire, ConfigEntry, Project, IssueType, WorkFlow} from "../type/issue";
import {Apollo} from "apollo-angular";
import * as operation from "../type/graphql.operations";
import {stripTypename} from "@apollo/client/utilities";
import {error} from "@angular/compiler-cli/src/transformers/util";

@Injectable({
  providedIn: 'root',
})
export class IssueService {
  baseUrl:string = "http://localhost:8081";
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
  getIssues(projet:string) {
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
  allCustomField(issueId:number){
    return this.apollo
      .query({
        query: operation.ALL_CUSTOMFIELD ,
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
  saveValues(value:any){
    return this.apollo
      .mutate({
        mutation: operation.SAVE_VALUE,
        variables:{value}
      });
  }
  loadDirectory(issueId:number): Observable<Repertoire> {
    let params = new HttpParams().set('issueId', issueId);
    let url = "http://localhost:8081/api/load-directory?"+params.toString();
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
    return `http://localhost:8081/api/download${queryString}`;
  }
  upload(file: File, dir:string): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest('POST', `${this.baseUrl}/api/upload?directory=`+dir, formData, {
      reportProgress: true,
      responseType: 'text'
    });
    return this.http.request(req);
  }
  saveProject(project: any) {
    alert("variable project "+JSON.stringify(project));
    return this.apollo.mutate({
      mutation:operation.SAVE_PROJECT,
      variables: {project}
    })
  }
  getProject(prefix:String){
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
         this.project.issuTypes.push(res.data.saveIssueType);
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
    return new Observable<WorkFlow>((observer)=>{
      this.apollo.mutate({
        mutation: operation.AFFECT_WORKFLOW,
        variables: {issueType}
      }).subscribe((res:any)=>{
        observer.next(res.data.affectWorkFlow);
        observer.complete();
      },(err)=>{
        observer.error(err);
        observer.complete();
      })
    });
  }

  loadAllProject() {
    return this.apollo.query({
      query: operation.ALL_PROJECT
    });
  }

  getAllProject() {
    return new Observable((observable) => {
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
}
