import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpRequest} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {ConfigEntry, GroupeUser, Issue, MemberGroupe, Status, User} from "../type/issue";
import {
  ADD_USER_IN_GROUPE,
  ALL_ISSUE,
  ALL_USERS, GET_GROUPE_USER_FOR_PROJECT, GET_USER,
  INIT_USER,
  LOAD_GROUPE_MEMBER,
  SAVE_CONFIG,
  SAVE_USER, supprimerTypename
} from "../type/graphql.operations";
import {Apollo} from "apollo-angular";
import {environment} from "../../environments/environment";
import {stripTypename} from "@apollo/client/utilities";

@Injectable({
  providedIn: 'root',
})
export class UserService {
   private usersSubject = new BehaviorSubject<User[]>([]);
   private canAssignUsersSubject = new BehaviorSubject<User[]>([]);
   users$ = this.usersSubject.asObservable();
   canAssignUsers$ = this.canAssignUsersSubject.asObservable();
  private groupeUsersSubject = new BehaviorSubject<GroupeUser[]>([]);
  groupeUsers$=this.groupeUsersSubject.asObservable();
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
      this.apollo
        .query({
          query: ALL_USERS ,
        }).subscribe((res:any)=> {
          this.usersSubject.next(stripTypename(res.data.allUsers));
        },error => {
          error.error(error);
        })
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
  saveUser(user:User) {
    var userApp:any = {...user};
    delete  userApp.permissions;
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
      return environment.apiURL+'photo/'+user.photo;
    }
    return environment.apiURL+'assets/user.png';
  }

  addUserInGroupe(username: string, groupeId: number, roles: String[]){
    return new Observable<MemberGroupe>(observer =>{
      this.apollo.mutate(
        {
          mutation:ADD_USER_IN_GROUPE,
          variables:{username,groupeId,roles},
          fetchPolicy:"network-only"
        }
      ).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.addUserInGroupe));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  getUser(username: String) {
    return new Observable<User>(observer =>{
      this.apollo.mutate(
        {
          mutation:GET_USER,
          variables:{username},
          fetchPolicy:"network-only"
        }
      ).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.getUser));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
  })
  }
  loadGroupeUserForProject(projectId: Number) {
    this.apollo.query({
      query: GET_GROUPE_USER_FOR_PROJECT,
      variables: {projectId},
      fetchPolicy: "network-only"
    }).subscribe((res: any) => {
        let groups:GroupeUser[] = supprimerTypename(res.data.getGroupeUserForProject);
        this.groupeUsersSubject.next(groups);
        this.extractUserRules(groups);
      }, error => {
        console.error(error);
      }
    )
  }
  private extractUserRules(groups: GroupeUser[]) {
    let  allAccessible:User[]=[];
    groups.forEach(groupe=> {
      groupe.members.forEach(member => {
        allAccessible.push(member.user);
      })
    });
    this.canAssignUsersSubject.next(allAccessible);
  }
}
