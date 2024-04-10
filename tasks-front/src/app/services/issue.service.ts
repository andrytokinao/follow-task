import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {Issue, Status, User, Comment, Repertoire, ConfigEntry} from "../type/issue";
import {Apollo} from "apollo-angular";
import {
  SAVE_ISSUE,
  ALL_ISSUE,
  ALL_STATUS,
  ADD_COMMENT,
  ALL_COMMENT,
  GET_VALUES,
  ALL_CUSTOMFIELD, SAVE_VALUE,
  LOAD_GROUPE_MEMBER, SAVE_CONFIG
} from "../type/graphql.operations";
import {stripTypename} from "@apollo/client/utilities";

@Injectable({
  providedIn: 'root',
})
export class IssueService {
  baseUrl:string = "http://localhost:8081";
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
        query: ALL_STATUS ,
      });
  }
  getIssues(projet:string) {
    return this.apollo
      .query({
        query: ALL_ISSUE ,
      });
  }
  saveIssue(issue:any){
    return this.apollo
      .mutate({
        mutation:SAVE_ISSUE,
        variables:{issue}
        }
      );
  }
  addComment(comment:Comment){
    return this.apollo.mutate({
      mutation:ADD_COMMENT,
      variables:{comment}
    });
  }


  allComment(issueId:number){
    return this.apollo
      .query({
        query: ALL_COMMENT ,
        variables:{issueId}
      });
  }
  allCustomField(issueId:number){
    return this.apollo
      .query({
        query: ALL_CUSTOMFIELD ,
        variables:{issueId}
      });
  }

  getValues(issueId:number){
    return this.apollo
      .query({
        query: GET_VALUES ,
        variables:{issueId}
      });
  }
  saveValues(value:any){
    return this.apollo
      .mutate({
        mutation: SAVE_VALUE,
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
}
