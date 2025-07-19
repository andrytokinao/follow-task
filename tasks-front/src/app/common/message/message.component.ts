import {Component, Input} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Canall, Project, User} from "../../type/issue";
import {MessagesService} from "../../services/messages.service";
import {UserService} from "../../services/user.service";
import {IssueService} from "../../services/issue.service";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-message',
  imports: [
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent {
  @Input() canal:Canall;
  protected user:User;
  newMessage: string = '';

  constructor(protected messageService:MessagesService,
              public userService:UserService,
              private issueService:IssueService,
              private authService:AuthService
  ) {

  }

  chatName() {
    return this.messageService.chatName(this.canal);
  }

  getPhoto() {
    return this.messageService.getPhoto(this.canal);
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messageService.sendMessage(this.newMessage,this.canal.id);
      this.newMessage = '';
    }
  }

  closeChat() {
    this.messageService.closeChat(this.canal);
  }
}
