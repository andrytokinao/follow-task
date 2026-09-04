import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpRequest} from '@angular/common/http';
import {BehaviorSubject, map, Observable, throwError} from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {
  ConfigEntry, GroupeUser, Issue, MemberGroupe, Permission, Status, User,
  UserPage, UserSearchCriteria
} from "../type/issue";
import {
  ADD_USER_IN_GROUPE,
  ALL_GROUPES,
  ALL_ISSUE,
  ALL_USERS, GET_GROUPE_USER_FOR_PROJECT, GET_USER,
  INIT_USER,
  LOAD_GROUPE_MEMBER,
  SAVE_CONFIG,
  LOAD_PERMISSION_TASK,
  SAVE_USER, SEARCH_USERS, supprimerTypename, DELETE_MEMBER
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
  private usersLoadingSubject = new BehaviorSubject<boolean>(false);
  usersLoading$ = this.usersLoadingSubject.asObservable();

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
  /**
   * Recharge la liste des utilisateurs et alimente users$.
   * @param forceReload ignore le cache Apollo (utile apres une creation/edition)
   */
  allUsers(forceReload: boolean = false) {
      this.usersLoadingSubject.next(true);
      this.apollo
        .query({
          query: ALL_USERS ,
          fetchPolicy: forceReload ? "network-only" : "cache-first"
        }).subscribe((res:any)=> {
          let users:User[] = stripTypename(res.data.allUsers);
          this.usersSubject.next(users.filter(u => u.username && u.firstName && u.lastName));
          this.usersLoadingSubject.next(false);
        },error => {
          console.error("allUsers ==> ", error);
          this.usersLoadingSubject.next(false);
        })
  }

  /**
   * Recherche paginée d'utilisateurs.
   *
   * Contrairement à `allUsers`, rien n'est mis dans `users$` : la page
   * d'administration est le seul consommateur d'un résultat paginé, et y
   * déverser une page partielle ferait croire aux autres écrans que
   * l'application ne compte que vingt comptes.
   */
  searchUsers(criteria: UserSearchCriteria): Observable<UserPage> {
    return this.apollo.query({
      query: SEARCH_USERS,
      variables: {criteria},
      fetchPolicy: "network-only"
    }).pipe(
      map((res: any) => {
        const page = res?.data?.searchUsers;
        if (!page) {
          throw new Error('Recherche indisponible');
        }
        return supprimerTypename(page) as UserPage;
      }),
      catchError(error => {
        console.error("searchUsers ==> ", error);
        return throwError(() => error);
      })
    );
  }

  allGroupes(): Observable<GroupeUser[]> {
    return this.apollo.query({
      query: ALL_GROUPES,
      fetchPolicy: "network-only"
    }).pipe(
      map((res: any) => supprimerTypename(res.data.allGroupes) as GroupeUser[]),
      catchError(error => {
        console.error("allGroupes ==> ", error);
        return throwError(() => error);
      })
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
  loadGroupeMember(userId:string){
    return this.apollo
      .query({
        query: LOAD_GROUPE_MEMBER,
        variables:{userId},
        fetchPolicy:"network-only"
      });
  }

  /**
   * Groupes/roles d'un utilisateur, deja nettoyes du __typename.
   */
  getGroupeMember(userId: string): Observable<MemberGroupe[]> {
    return this.loadGroupeMember(userId).pipe(
      map((res: any) => supprimerTypename(res.data.loadGroupeMember) as MemberGroupe[])
    );
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
  /**
   * Définit le mot de passe d'un compte depuis l'administration.
   *
   * Distinct d'un changement de mot de passe : l'actuel n'est pas demandé, un
   * administrateur ne le connaît pas. Le serveur vérifie lui-même les droits —
   * l'écran d'administration ne fait que cacher le bouton.
   */
  definirMotDePasse(userId: string, motDePasse: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${userId}/password`,
      {newPassword: motDePasse}, {withCredentials: true});
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
