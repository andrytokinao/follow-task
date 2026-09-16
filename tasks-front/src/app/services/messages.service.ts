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
  SEND_MESSAGE_APP,
  supprimerTypename
} from "../type/graphql.operations";
import {Apollo} from "apollo-angular";
import {IssueService} from "./issue.service";
import {AuthService} from "./auth.service";
import {UserService} from "./user.service";
import * as SockJS from 'sockjs-client';
import {Client, Message, Stomp, StompConfig, StompHeaders} from '@stomp/stompjs';
import {ActionService} from "./action.service";
import {DocumentService} from "./document.service";
import {NotificationService} from "./notification.service";


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
  private connectedUserId: String | undefined;
  private surveillanceOngletPosee = false;
  /** Etat du canal temps reel, pour signaler un mode degrade a l'ecran. */
  private wsConnectedSubject = new BehaviorSubject<boolean>(false);
  wsConnected$ = this.wsConnectedSubject.asObservable();

  connectedUser
  private showSmartSubject = new BehaviorSubject<string>('');
  showSmartRight$ = this.showSmartSubject.asObservable();
  constructor(
    private http:HttpClient,
    private apollo:Apollo,
    private issueService:IssueService,
    private authService:AuthService,
    private userService:UserService,
    private actionService:ActionService,
    private documentService:DocumentService,
    private notificationService:NotificationService
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
  sendMessage(text:string , cannalId:Number) {
    let newMessage:MessageApp ={
      canall:{id:cannalId,typeCanal:'PROJECT'},
      sender:{id:this.connectedUser.id},
      text:text,
    }
    this.apollo.mutate(
      {
        mutation:SEND_MESSAGE_APP,
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
  /**
   * Ouvre le canal temps réel de l'utilisateur.
   *
   * Le courtier STOMP côté serveur ne conserve rien : un évènement émis
   * pendant une coupure est perdu pour de bon. Le websocket n'est donc qu'une
   * accélération, jamais la source de vérité. Trois garde-fous en découlent :
   *
   * - reconnexion automatique, avec battements de cœur pour détecter une
   *   liaison morte que le navigateur croit encore ouverte (proxy, veille,
   *   passage wifi/4G) ;
   * - à chaque (re)connexion, on recharge les notifications depuis le serveur
   *   pour rattraper ce qui a pu se perdre ;
   * - au retour sur l'onglet, même rattrapage : un onglet en arrière-plan peut
   *   avoir été suspendu sans que la socket soit formellement fermée.
   */
  connectWs(connectedUserId:String){
    if (!connectedUserId) {
      return;
    }
    if (this.client && this.client.active && this.connectedUserId === connectedUserId) {
      // Deja branche sur le bon canal : reactiver creerait un second client,
      // et chaque message arriverait en double.
      return;
    }
    this.disconnectWs();
    this.connectedUserId = connectedUserId;

    let head:StompHeaders= {
      'kokok':'kokoko'
    }
    // « api/ws » et non « ws » : le repli SPA du serveur
    // (GQUserController.publicRedirection) renvoie vers index.html tout chemin
    // sans point qui ne commence pas par « assets » ou « api ». Une requete sur
    // /ws/info recevait donc la page HTML au lieu du JSON SockJS, et la
    // connexion n'aboutissait jamais : aucune notification n'arrivait en
    // direct, elles n'apparaissaient qu'au rechargement.
    const url = environment.apiURL + 'api/ws';
    // Le client est capture dans une constante : les callbacks survivent a une
    // deconnexion, et this.client peut deja pointer ailleurs (ou etre vide)
    // quand elles se declenchent.
    const client = new Client({
      webSocketFactory: () => new SockJS(url, head),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });
    this.client = client;
    client.onConnect = () => {
      client.subscribe('/topic/datas/'+connectedUserId, (message: Message) => {
        this.processRealTimeData(message.body);
      });
      this.wsConnectedSubject.next(true);
      console.info('[ws] connecté sur', url, '— canal /topic/datas/' + connectedUserId);
      this.rattraper();
    };
    client.onWebSocketClose = (evt: any) => {
      this.wsConnectedSubject.next(false);
      // Trace explicite : une poignee de main refusee (mauvais chemin, origine
      // non autorisee, session expiree) se traduisait sinon par un silence
      // impossible a distinguer d'une absence de notification.
      console.warn('[ws] fermé', url, evt?.code ?? '', evt?.reason ?? '');
    };
    client.onWebSocketError = (evt: any) => {
      this.wsConnectedSubject.next(false);
      console.error('[ws] erreur de transport sur', url, evt);
    };
    client.onStompError = (frame) => {
      this.wsConnectedSubject.next(false);
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };
    client.activate();
    this.surveillerRetourOnglet();
  }
  disconnectWs() {
    this.connectedUserId = undefined;
    this.wsConnectedSubject.next(false);
    if(this.client != null) {
      const ancien = this.client;
      this.client = undefined;
      ancien.deactivate().then(() => console.log('Déconnecté du serveur WebSocket'));
    }
  }

  /** Rejoue l'état serveur : ce qui s'est perdu pendant la coupure revient. */
  private rattraper() {
    this.notificationService.reload();
  }

  /**
   * Un onglet en arrière-plan peut être gelé par le navigateur : la socket
   * reste ouverte de son point de vue, mais les messages n'arrivent plus. On
   * ne le détecte qu'au retour, d'où ce rattrapage.
   */
  private surveillerRetourOnglet() {
    if (this.surveillanceOngletPosee || typeof document === 'undefined') {
      return;
    }
    this.surveillanceOngletPosee = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !this.connectedUserId) {
        return;
      }
      if (this.client && !this.client.connected) {
        // activate() est idempotent : il relance la boucle de reconnexion si
        // elle s'est arrêtée.
        this.client.activate();
      }
      this.rattraper();
    });
  }
  processRealTimeData(body:any) {
    // Une seule analyse du corps : il etait relu autant de fois qu'il y a de
    // canaux, et un corps mal forme faisait tomber tout le traitement sans
    // trace. Ici l'echec est signale et la socket reste utilisable.
    let charge: any;
    try {
      charge = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
      console.error('Message temps réel illisible, ignoré', e, body);
      return;
    }
    if (!charge) {
      return;
    }

    const newMessages:MessageApp[] = charge.newMessage;
    const documentData:DocumentApp = charge.processDocument;
    const newNotification:NotificationApp = charge.newNotification;
    const notificationRead:any = charge.notificationRead;
    const newUploaded:Uploaded = charge.newUploaded;
    const actionItem:ActionItem = charge.processAction;
    const slideDossier:Repertoire = charge.slideDossier;

    if (newMessages) {
       newMessages.forEach( nm=> {
         this.newMessageSubject.next(nm);
       })
    }
    if (documentData) {
      console.info('documentData',documentData);
      this.documentService.processDocument(documentData);
    }

    if (newNotification) {
      this.notificationService.push(newNotification);
    }
    if (notificationRead) {
      // Lecture faite depuis un autre onglet ou un autre appareil : on aligne
      // l'etat local, sinon la pastille resterait allumee ici.
      this.notificationService.applyReadEcho(notificationRead.ids, notificationRead.read);
    }
    if (newUploaded) {
      console.info('newUploaded', newUploaded);
    }
    if (actionItem) {
      this.issueService.processAction(actionItem);
    }
    if (slideDossier) {
      this.issueService.nextImage(slideDossier);
    }
  }
  processNotification(notification:NotificationApp){
    this.notificationService.push(notification);
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
