import { Component } from '@angular/core';
interface ChatMessage {
  sender: string;
  content: string;
  timestamp: Date;
}
@Component({
  standalone:false,
  selector: 'app-chat-widget',
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css']
})
export class ChatWidgetComponent {
  isOpen = false;
  newMessage = '';
  currentUser = 'Moi';

  messages: ChatMessage[] = [
    { sender: 'Alice', content: 'Salut tout le monde 👋', timestamp: new Date() },
    { sender: 'Bob', content: 'On se connecte pour la réunion ?', timestamp: new Date() }
  ];

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({
        sender: this.currentUser,
        content: this.newMessage.trim(),
        timestamp: new Date()
      });
      this.newMessage = '';
    }
  }
}
