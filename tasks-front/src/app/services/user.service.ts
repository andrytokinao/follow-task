import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {Issue, Status, User} from "../type/issue";
import {ALL_ISSUE, ALL_USERS, LOAD_GROUPE_MEMBER} from "../type/graphql.operations";
import {Apollo} from "apollo-angular";

@Injectable({
  providedIn: 'root',
})
export class UserService {

  constructor(private http: HttpClient, private apollo: Apollo) {
  }

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  getUsersTest(): Observable<User[]> {
    let url = "assets/users.json";
    return this.http
      .get<User[]>(url)
      .pipe(retry(1), catchError(this.handleError));
  }
  getUsers(projet:string) {
    return this.apollo
      .query({
        query: ALL_USERS ,
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
  loadGroupeMember(userId:number){
    return this.apollo
      .query({
        query: LOAD_GROUPE_MEMBER,
        variables:{userId}
      });
  }
}
