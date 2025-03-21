import { Injectable } from '@angular/core';
import {Canall, Issue, MessageApp, Project, User} from "../type/issue";
import {BehaviorSubject, Observable} from "rxjs";
import {HttpClient, HttpEvent, HttpRequest} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {
  ADD_USER_IN_GROUPE,
  CREATE_CANAL,
  GET_CANAL_BY_PROJECT,
  SEND_MESSAGE,
  supprimerTypename
} from "../type/graphql.operations";
import {Apollo} from "apollo-angular";
import {IssueService} from "./issue.service";
import {AuthService} from "./auth.service";
import {UserService} from "./user.service";

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private canalsSubject = new BehaviorSubject<Canall[]>([]);
  canals$ = this.canalsSubject.asObservable();
  private newMessageSubject = new BehaviorSubject<MessageApp>(undefined);
  newMessage$ = this.newMessageSubject.asObservable();
  project:Project;
  canals:Canall[] = [];
  users:User[] = [];
  connectedUser
  constructor(
    private http:HttpClient,
    private apollo:Apollo,
    private issueService:IssueService,
    private authService:AuthService,
    private userService:UserService
  ) {
    this.issueService.project$.subscribe(project => {
      this.project = project;
      if (this.project && this.project.id && this.connectedUser && this.connectedUser.id) {
        this.loadCanals(this.project.id , [this.connectedUser.id]);
      }
    });
    this.authService.connectedUser$.subscribe(user => {
      this.connectedUser = user;
      if (this.project && this.project.id && this.connectedUser && this.connectedUser.id) {
        this.loadCanals(this.project.id , [this.connectedUser.id]);
      }
    });
    this.userService.users$.subscribe( users => {
      this.users = users;
    })
  }
  getCanall(workspaceId:Number, userIds:String[]) {

  }
  sendMessage(text:String , cannalId:Number) {
    let newMessage:MessageApp ={
      canall:{id:cannalId,typeCanal:'PROJECT'},
      sender:{id:this.connectedUser.id},
      text:text,
    }
    this.apollo.mutate(
      {
        mutation:SEND_MESSAGE,
        variables:{newMessage},
        fetchPolicy:'network-only'
      }
    ).subscribe((res:any)=> {
      this.newMessageSubject.next(supprimerTypename(res.data.sendMessage()));
    },error => {
      console.error(error);
    })

  }
  getPhoto(canall:Canall){
    let otherUsers = this.getOtherUsers(canall);
    return this.userService.getUrlPhoto(otherUsers[0]);
  }
  getSenderPhoto(message:MessageApp){
   let sender = this.users.find(user => user.id === message.sender.id );
   if (sender)
     return this.userService.getUrlPhoto(sender);
   return '';
  }
  getOtherUsers(cannel:Canall) {
    return  cannel.members.map(member => member.user).filter(user => user.id !== this.connectedUser.id)
  }
  chatName(canal:Canall) {
    let othersUsers = this.getOtherUsers(canal);
    return othersUsers.map(user => user.firstName).join(",")
  }
  senderIsMe(message: MessageApp) {
    return this.connectedUser.id === message.sender.id;
  }

  private loadCanalsReactive() {
    this.http.get<Canall[]>(environment.apiURL+"api/messages/get-canals",{withCredentials:true}).subscribe(
      (res: any) => {
        this.canalsSubject.next(res);
      },
      (err)=>{
        console.error(err);
      }
    );
  }
   loadCanals(projectId:Number,userIds:String[]){
    this.getCanalByProject(projectId,userIds).subscribe( canals => {
      this.canalsSubject.next(canals);
    })
   }
  createCanal(canall: Canall) {
    return new Observable<Canall>(observer => {
      this.apollo.mutate(
        {
          mutation:CREATE_CANAL,
          variables:{canall},
          fetchPolicy:"network-only"
        }
      ).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.createCanal));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
    }
  getCanalByProject(projectId:Number,userIds:String[]) {
    return new Observable<Canall[]>(observer => {
      this.apollo.query(
        {
          query:GET_CANAL_BY_PROJECT,
          variables:{projectId,userIds},
          fetchPolicy:"network-only"
        }
      ).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.getCanalByProject));
        observer.complete();
      },error => {
        observer.error(error);
        observer.complete();
      })
    })
  }
}
