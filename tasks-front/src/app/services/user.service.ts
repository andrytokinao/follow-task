import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpRequest} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {ConfigEntry, Issue, Status, User} from "../type/issue";
import {ALL_ISSUE, ALL_USERS, INIT_USER, LOAD_GROUPE_MEMBER, SAVE_CONFIG, SAVE_USER} from "../type/graphql.operations";
import {Apollo} from "apollo-angular";

@Injectable({
  providedIn: 'root',
})
export class UserService {

  constructor(private http: HttpClient, private apollo: Apollo) {
  }
  baseUrl:string = "http://localhost:8081";

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
  getUsers(projet:String) {
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
  saveUser(userApp:User) {
    return this.apollo.mutate(
      {
        mutation : SAVE_USER,
        variables :{userApp}
      }
    )
  }
  initUser(userApp:User) {
    return this.apollo.mutate(
      {
        mutation : INIT_USER,
        variables :{userApp}
      }
    )
  }
  upload(file: File, userId:string): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest('POST', `${this.baseUrl}/api/upload/photo?userId=`+userId, formData, {
      reportProgress: true,
      withCredentials:true,
      responseType: 'text'
    });
    return this.http.request(req);
  }

  getUrlPhoto(user: User) {
    if (user.photo != null) {
      return 'http://localhost:8081/photo/'+user.photo
    }
    return 'assets/user.png';
  }
}
