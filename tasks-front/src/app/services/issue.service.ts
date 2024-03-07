import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {Issue, Status} from "../type/issue";
import {Apollo} from "apollo-angular";
import {ADD_ISSUE, ALL_ISSUE, ALL_STATUS} from "../type/graphql.operations";
import {useMutation} from "@apollo/client";

@Injectable({
  providedIn: 'root',
})
export class IssueService {
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
  createIssue(issue:any){
    return this.apollo
      .mutate({
        mutation:ADD_ISSUE,
        variables:{issue}
        }
      );
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

}
