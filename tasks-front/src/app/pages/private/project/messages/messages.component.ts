import { Component } from '@angular/core';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent {
  chats = [
    {
      name: 'Alice',
      photo: 'https://randomuser.me/api/portraits/women/1.jpg',
      messages: [
        { text: 'Salut !', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
        { text: 'Comment vas-tu ?', sender: 'mee' },
        { text: 'Comment vas-tu ?', sender: 'Alice' },
      ]
    },
    {
      name: 'Bob',
      photo: 'https://randomuser.me/api/portraits/men/1.jpg',
      messages: [
        { text: 'Salut !', sender: 'Bob' },
        { text: 'Tu es dispo ?', sender: 'Bob' }
      ]
    },
    {
      name: 'Charlie',
      photo: 'https://randomuser.me/api/portraits/men/2.jpg',
      messages: [
        { text: 'Hey !', sender: 'Charlie' }
      ]
    }
  ];

  selectedChat = this.chats[0]; // Sélection par défaut
  newMessage: string = '';

  selectChat(chat: any) {
    this.selectedChat = chat;
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.selectedChat.messages.push({ text: this.newMessage, sender: 'me' });
      this.newMessage = '';
    }
  }
}
