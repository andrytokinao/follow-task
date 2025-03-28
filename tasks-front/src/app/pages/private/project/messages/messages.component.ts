import { Component } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {Canall, MessageApp, Project, User} from "../../../../type/issue";
import {MessagesService} from "../../../../services/messages.service";
import {UserService} from "../../../../services/user.service";
import {IssueService} from "../../../../services/issue.service";
import {getDisplayName} from "@apollo/client/react/hoc/hoc-utils";
import {AuthService} from "../../../../services/auth.service";

@Component({
  standalone:false,
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent {
  private project: Project;
  protected hasSelectedUsers: boolean = false;
  protected user:User;

  constructor(protected messageService:MessagesService,
              public userService:UserService,
              private issueService:IssueService,
              private authService:AuthService
  ) {
    this.messageService.canals$.subscribe(canales => {
      this.canals = canales;
    });
    this.authService.connectedUser$.subscribe( user => {
      this.user = user;
    });
    this.userService.users$.subscribe(users=> {
      this.users = users;
      if (this.user && this.user.id) {
        this.userToCanal= [... this.users].filter(u => u.id != this.user.id);
      } else {
        this.userToCanal= [... this.users];
      }
    });
    this.issueService.project$.subscribe(project => {
      this.project = project;
    });
    this.messageService.newMessage$.subscribe(message => {
      this.pushNewMessage(message);
    })

  }

  canals:Canall[] = [];

  selectedCanall = this.canals[0]; // Sélection par défaut
  newMessage: string = '';
  users:User[] = [];
  userToCanal:User[] = [];
  selectedUsers:String[] = [];

  selectChat(chat: any) {
    this.selectedCanall = chat;
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messageService.sendMessage(this.newMessage,this.selectedCanall.id);
      this.newMessage = '';
    }
  }


  isSelectedUser(id: string) {
    return this.selectedUsers.some(usr=> usr === id);
  }

  selectUser(event: any, user: User) {
    if (event.checked) {
      if (!this.selectedUsers)
        this.selectedUsers = [];
      this.selectedUsers.push(user.id);
    } else {
      this.selectedUsers = this.selectedUsers.filter(cf => cf != user.id);
    }
    return true;
  }

  createCanal() {
    let members:String[] = [... this.selectedUsers];
    members.push(this.user.id);
    let canall:Canall = {
      membersIds:members,
      typeCanal:'PROJECT',
      projects:{id:this.project.id}
    };
    this.messageService.createCanal(canall).subscribe( c =>{
      this.messageService.loadCanals();
    });
  }

  stopPropagation($event: MouseEvent) {
    event.stopPropagation();
  }
  chatName(canal:Canall) {
    if (!canal)
      return "Selected";
    return this.messageService.chatName(canal)
  }

  pushNewMessage(message: MessageApp) {
    if (!message)
      return;
    let canall = this.canals.find( canal => message.canall.id == canal.id);
    if (!canall)
      return;
    if (!canall.messageApp)
      canall.messageApp =[];
    canall.messageApp.push(message);
  }
}
