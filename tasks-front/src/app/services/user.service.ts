import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpRequest} from '@angular/common/http';
import {BehaviorSubject, map, Observable, throwError} from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {
  ConfigEntry, GroupeUser, Issue, MemberGroupe, Permission, RoleApp, Status, User,
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
  SAVE_USER, SEARCH_USERS, SET_USER_ACTIVE, DEFINIR_DIRECTION, supprimerTypename, DELETE_MEMBER,
  ROLES_SYSTEME_DISPONIBLES, ROLES_SYSTEME_UTILISATEUR, DEFINIR_ROLES_SYSTEME,
  WHATSAPP_LINK_STATE, START_WHATSAPP_LINK, VERIFY_WHATSAPP_LINK, UNLINK_WHATSAPP
} from "../type/graphql.operations";
import {WhatsAppLinkState} from "../type/whatsapp-link";
import {RapportImportUsers} from "../type/import-users";
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

  /**
   * Désactive ou réactive un compte. Réservé à SYSTEM_ADMIN côté serveur.
   * La liste `users$` est rechargée : un compte désactivé ne doit plus être
   * proposé dans les sélecteurs.
   */
  setUserActive(id: string, active: boolean): Observable<User> {
    return this.apollo.mutate({
      mutation: SET_USER_ACTIVE,
      variables: {id, active}
    }).pipe(
      map((res: any) => {
        this.allUsers(true);
        return supprimerTypename(res.data.setUserActive) as User;
      })
    );
  }

  /**
   * Fait d'un utilisateur un membre de la direction, ou le retire. Ses autres
   * rôles système restent inchangés.
   */
  definirDirection(userId: string, direction: boolean): Observable<unknown> {
    return this.apollo.mutate({
      mutation: DEFINIR_DIRECTION,
      variables: {userId, direction}
    });
  }

  /** Rôles système existants (application.yml). Réservé à SYSTEM_ADMIN côté serveur. */
  rolesSystemeDisponibles(): Observable<RoleApp[]> {
    return this.apollo.query({
      query: ROLES_SYSTEME_DISPONIBLES,
      fetchPolicy: "network-only"
    }).pipe(map((res: any) => supprimerTypename(res.data.rolesSystemeDisponibles ?? []) as RoleApp[]));
  }

  /** Rôles système actuels d'un utilisateur, sans ses rôles d'espace de travail. */
  rolesSystemeUtilisateur(userId: string): Observable<string[]> {
    return this.apollo.query({
      query: ROLES_SYSTEME_UTILISATEUR,
      variables: {userId},
      fetchPolicy: "network-only"
    }).pipe(map((res: any) => [...(res.data.rolesSystemeUtilisateur ?? [])]));
  }

  /** Remplace l'ensemble des rôles système d'un utilisateur. */
  definirRolesSysteme(userId: string, roles: string[]): Observable<unknown> {
    return this.apollo.mutate({
      mutation: DEFINIR_ROLES_SYSTEME,
      variables: {userId, roles}
    });
  }

  /** Rôle système DIRECTION (voir application.yml), lu dans les groupes de l'utilisateur. */
  static estDirection(user: User | undefined | null): boolean {
    return !!user?.groupes?.some(membre => membre.roles?.includes('DIRECTION'));
  }

  /** Un compte sans valeur `active` est antérieur à la désactivation : il est actif. */
  static estActif(user: User | undefined | null): boolean {
    return !!user && user.active !== false;
  }

  // -----------------------------------------------------------------
  // Rattachement WhatsApp
  // -----------------------------------------------------------------
  // Les quatre operations portent sur l'utilisateur connecte et rendent le
  // meme etat complet : l'ecran se redessine d'une seule reponse.

  whatsAppLinkState(): Observable<WhatsAppLinkState> {
    return this.apollo.query({
      query: WHATSAPP_LINK_STATE,
      fetchPolicy: "network-only"
    }).pipe(
      map((res: any) => supprimerTypename(res.data.whatsAppLinkState) as WhatsAppLinkState)
    );
  }

  /** Demande un code a envoyer au numero du systeme. */
  startWhatsAppLink(): Observable<WhatsAppLinkState> {
    return this.apollo.mutate({
      mutation: START_WHATSAPP_LINK
    }).pipe(
      map((res: any) => supprimerTypename(res.data.startWhatsAppLink) as WhatsAppLinkState)
    );
  }

  /** Cherche le code dans les messages recus ; l'etat rendu dit s'il a ete trouve. */
  verifyWhatsAppLink(): Observable<WhatsAppLinkState> {
    return this.apollo.mutate({
      mutation: VERIFY_WHATSAPP_LINK
    }).pipe(
      map((res: any) => supprimerTypename(res.data.verifyWhatsAppLink) as WhatsAppLinkState)
    );
  }

  unlinkWhatsApp(): Observable<WhatsAppLinkState> {
    return this.apollo.mutate({
      mutation: UNLINK_WHATSAPP
    }).pipe(
      map((res: any) => supprimerTypename(res.data.unlinkWhatsApp) as WhatsAppLinkState)
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
    delete userApp.groupes;
    // Absent de UserAppInput : l'état actif ne change que par setUserActive.
    delete userApp.active;
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

  /**
   * Crée en une fois les utilisateurs décrits par un classeur Excel.
   *
   * Le serveur répond 200 même quand des lignes ont été rejetées : un import
   * est partiel par nature, et c'est le rapport qui porte le détail. Seul un
   * fichier illisible dans son ensemble donne une erreur HTTP.
   */
  importerUtilisateurs(fichier: File): Observable<RapportImportUsers> {
    const formData: FormData = new FormData();
    formData.append('file', fichier);
    return this.http.post<RapportImportUsers>(`${this.apiUrl}/users/import`, formData,
      {withCredentials: true});
  }

  /** Classeur vierge aux bons intitulés, avec une ligne d'exemple. */
  modeleImportUtilisateurs(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/users/import/modele`,
      {responseType: 'blob', withCredentials: true});
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
        groupe.members.map(member => member.user).filter(UserService.estActif)
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
            .filter(UserService.estActif)
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
        // Les comptes désactivés restent membres du groupe (l'écran
        // d'accessibilité les montre) mais ne sont plus proposés à l'assignation.
        this.allMemberSubject.next(
          groups.flatMap(g => g.members.map(m => m.user).filter(UserService.estActif))  // ← Subject User[]
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
