import { Injectable } from '@angular/core';
import {
  ActionItem,
  Canall,
  DocumentApp,
  Issue,
  MessageApp,
  NotificationApp,
  Project, Repertoire,
  Uploaded,
  User
} from "../type/issue";
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
import * as SockJS from 'sockjs-client';
import {Client, Message, Stomp, StompConfig, StompHeaders} from '@stomp/stompjs';
import {ActionService} from "./action.service";


@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private canalsSubject = new BehaviorSubject<Canall[]>([]);
  canals$ = this.canalsSubject.asObservable();
  private showCanalsSubject = new BehaviorSubject<Canall>(undefined);
  showCanals$ = this.showCanalsSubject.asObservable();
  private closeCanalsSubject = new BehaviorSubject<Canall>(undefined);
  closeCanals$ = this.closeCanalsSubject.asObservable();
  private newMessageSubject = new BehaviorSubject<MessageApp>(undefined);
  newMessage$ = this.newMessageSubject.asObservable();
  private notificationSubject = new BehaviorSubject<NotificationApp[]>([]);
  notification$ = this.notificationSubject.asObservable();
  project:Project;
  canals:Canall[] = [];
  users:User[] = [];
  private client: Client;

  connectedUser
  private showSmartSubject = new BehaviorSubject<string>('');
  showSmartRight$ = this.showSmartSubject.asObservable();
  constructor(
    private http:HttpClient,
    private apollo:Apollo,
    private issueService:IssueService,
    private authService:AuthService,
    private userService:UserService,
    private actionService:ActionService
  ) {
    this.issueService.project$.subscribe(project => {
      this.project = project;
      if (this.project && this.project.id && this.connectedUser && this.connectedUser.id) {
        this.loadCanals();
      }
    });
    this.authService.connectedUser$.subscribe(user => {
      this.connectedUser = user;
      if (this.project && this.project.id && this.connectedUser && this.connectedUser.id) {
        this.loadCanals();
      }
    });
    this.userService.users$.subscribe( users => {
      this.users = users;
    });

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
  //    this.newMessageSubject.next(supprimerTypename(res.data.sendMessage));
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
   loadCanals(){
    this.getCanalByProject(this.project.id,[this.connectedUser.id]).subscribe( canals => {
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
  };
  connectWs(connectedUserId:String){
    if (this.client) {
      if (this.client.connected) {
        return;
      }
    }
    let head:StompHeaders= {
      'kokok':'kokoko'
    }
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.apiURL+'ws',head)
    });
    this.client.onConnect = (frame) => {
      this.client.subscribe('/topic/datas/'+connectedUserId, (message: Message) => {
        this.processRealTimeData(message.body);
      });
    };
    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };
    this.client.activate();

  }
  disconnectWs() {
    if(this.client != null) {
      this.client.deactivate().then(() => console.log('Déconnecté du serveur WebSocket'));
    }
  }
  processRealTimeData(body:any) {

    let newMessages:MessageApp[] =   JSON.parse(body,(key, value:MessageApp[]) => {
      return value;
    }).newMessage;
    let documentData:DocumentApp = JSON.parse(body,(key,value:DocumentApp) => {
      return value;
    }).processDocument ;
    let newNotification:NotificationApp = JSON.parse(body,(key,value:NotificationApp) => {
      return value;
    }).newNotification ;
    let newUploaded:Uploaded = JSON.parse(body,(key,value:Uploaded) => {
      return value;
    }).newUploaded;
    let actionItem:ActionItem = JSON.parse(body,(key,value:ActionItem) => {
      return value;
    }).processAction;
    let slideDossier:Repertoire = JSON.parse(body,(key,value:ActionItem) => {
      return value;
    }).slideDossier;



    if (newMessages) {
       newMessages.forEach( nm=> {
         this.newMessageSubject.next(nm);
       })
    }
    if (documentData) {
      console.info('documentData',documentData);
      this.issueService.processDocument(documentData);
    }

    if (newNotification) {
      this.actionService.nextNotification(newNotification);
    }
    if (newUploaded) {
      alert("new Uploaded "+JSON.stringify(newUploaded));
    }
    if (actionItem) {
      this.issueService.processAction(actionItem);
    }
    if (slideDossier) {
      this.issueService.nextImage(slideDossier);
    }
  }
  processNotification(notification:NotificationApp){
    this.actionService.nextNotification(notification);
  }
  showCanal(canal:Canall){
    this.showCanalsSubject.next(canal);
  }

  showRight(s: string) {
    this.showSmartSubject.next(s);
  }

  closeChat(canal: Canall) {
    this.closeCanalsSubject.next(canal);
  }
}
