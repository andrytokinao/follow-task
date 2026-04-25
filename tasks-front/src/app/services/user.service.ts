import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpRequest} from '@angular/common/http';
import {BehaviorSubject, map, Observable, throwError} from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {ConfigEntry, GroupeUser, Issue, MemberGroupe, Permission, Status, User} from "../type/issue";
import {
  ADD_USER_IN_GROUPE,
  ALL_ISSUE,
  ALL_USERS, GET_GROUPE_USER_FOR_PROJECT, GET_USER,
  INIT_USER,
  LOAD_GROUPE_MEMBER,
  SAVE_CONFIG,
  LOAD_PERMISSION_TASK,
  SAVE_USER, supprimerTypename, DELETE_MEMBER
} from "../type/graphql.operations";
import {Apollo} from "apollo-angular";
import {environment} from "../../environments/environment";
import {stripTypename} from "@apollo/client/utilities";

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiURL+'api';
   private usersSubject = new BehaviorSubject<User[]>([]);
   private permissionTaskSubject=new BehaviorSubject<Permission>(undefined);
   permissionTask$ = this.permissionTaskSubject.asObservable();
   private allMemberSubject = new BehaviorSubject<User[]>([]);
   users$ = this.usersSubject.asObservable();
   allMembers$ = this.allMemberSubject.asObservable();
  private groupeUsersSubject = new BehaviorSubject<GroupeUser[]>([]);
  groupeUsers$=this.groupeUsersSubject.asObservable();

  constructor(private http: HttpClient, private apollo: Apollo) {
    this.allUsers();
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
  allUsers() {
      this.apollo
        .query({
          query: ALL_USERS ,
        }).subscribe((res:any)=> {
          let users:User[] = stripTypename(res.data.allUsers);
          this.usersSubject.next(users.filter(u => u.username && u.firstName && u.lastName));
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
  initUser(userApp: User) {
    return this.http.post<User>(environment.apiURL+'api/init-user', userApp, {
      withCredentials: true
    });
  }
  upload(file: File, userId:string): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    const req = new HttpRequest('POST', `${environment.apiURL}api/upload/photo?userId=`+userId, formData, {
      reportProgress: true,
      withCredentials:true,
      responseType: 'text'
    });
    return this.http.request(req);
  }

  getUrlPhoto(user: User) {
    if (user && user.photo) {
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
  getGroupeUserForProject(prefix: String): Observable<GroupeUser[]> {
    return this.apollo.query({
      query: GET_GROUPE_USER_FOR_PROJECT,
      variables: { prefix },
      fetchPolicy: "network-only"
    }).pipe(
      map((res: any) => supprimerTypename(res.data.getGroupeUserForProject) as GroupeUser[]),
      catchError(error => {
        console.error(error);
        return throwError(() => error);
      })
    );
  }

  getUsersForProject(prefix: String): Observable<User[]> {
    return this.getGroupeUserForProject(prefix).pipe(
      map(groups => groups.flatMap(groupe =>
        groupe.members.map(member => member.user)
      ))
    );
  }
  getUserForProjectAndRole(prefix: String, roles: string[]): Observable<User[]> {
    return this.getGroupeUserForProject(prefix).pipe(
      map(groups =>
        groups.flatMap(groupe =>
          groupe.members
            .filter(member =>
              member.roles.some(role => roles.includes(role))  // ← garde si au moins un rôle correspond
            )
            .map(member => member.user)
        )
      ),
      // Supprimer les doublons (un user peut être dans plusieurs groupes)
      map(users => [
        ...new Map(users.map(user => [user.id, user])).values()
      ])
    );
  }
  loadGroupeUserForProject(prefix: String): void {
    this.getGroupeUserForProject(prefix).subscribe({
      next: (groups) => {
        this.groupeUsersSubject.next(groups);                          // ← Subject GroupeUser[]
        this.allMemberSubject.next(
          groups.flatMap(g => g.members.map(m => m.user))             // ← Subject User[]
        );
      },
      error: (error) => console.error(error)
    });
  }

  loadPermissiontTask() {
    this.apollo.query({
      query: LOAD_PERMISSION_TASK,
      fetchPolicy: "cache-first"
    }).subscribe((res: any) => {
        let permissionTask = supprimerTypename(res.data.loadPermissiontTask);
        this.permissionTaskSubject.next(permissionTask);
      }, error => {
        console.error(error);
      }
    )
  }




  deleteMember(memberId: Number) {
    return new Observable<MemberGroupe>(observer =>{
      this.apollo.mutate(
        {
          mutation:DELETE_MEMBER,
          variables:{memberId},
          fetchPolicy:"network-only"
        }
      ).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.deleteMember));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }

  changePassword(
      id: String,
      currentPassword: string,
      newPassword: string
    ): Observable<any> {
      const body = { currentPassword, newPassword };
      return this.http.post(
        `${this.apiUrl}/users/${id}/change-password`,
        body
      );
    }

  }
