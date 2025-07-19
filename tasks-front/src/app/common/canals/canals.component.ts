import { Component } from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {Canall, MessageApp, Project, User} from "../../type/issue";
import {MessagesService} from "../../services/messages.service";
import {MatCheckbox} from "@angular/material/checkbox";
import {UserService} from "../../services/user.service";
import {IssueService} from "../../services/issue.service";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-canals',
  imports: [
    NgForOf,
    NgIf,
    MatMenuTrigger,
    MatCheckbox,
    MatMenu
  ],
  templateUrl: './canals.component.html',
  styleUrl: './canals.component.css'
})
export class CanalsComponent {
  constructor(
    protected messageService:MessagesService,
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
  userToCanal:User[] = [];
  canals: Canall[]=[];
  selectedCanall = this.canals[0];
  newMessage: string = '';
  users:User[] = [];
  selectedUsers:String[] = [];
  private project: Project;
  protected user:User;
  selectChat(canal: Canall) {
      this.messageService.showCanal(canal);
  }

  chatName(canal:Canall) {
    if (!canal)
      return "Selected";
    return this.messageService.chatName(canal)
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

  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
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

  closeCanal() {
    this.messageService.showRight('');
  }
}
