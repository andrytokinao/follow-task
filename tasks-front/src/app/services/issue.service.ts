import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {Issue, Status, User,Comment} from "../type/issue";
import {Apollo} from "apollo-angular";
import {useMutation} from "@apollo/client";
import _default from "chart.js/dist/plugins/plugin.tooltip";
import numbers = _default.defaults.animations.numbers;
import {SAVE_ISSUE, ALL_ISSUE, ALL_STATUS, ADD_COMMENT, ALL_COMMENT, GET_VALUES} from "../type/graphql.operations";

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

  getValues(issueId:number){
    return this.apollo
      .query({
        query: GET_VALUES ,
        variables:{issueId}
      });
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
