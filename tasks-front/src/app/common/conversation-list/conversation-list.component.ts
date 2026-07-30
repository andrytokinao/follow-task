

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanalDto, TypeCanal } from '../../models/messaging.model';
import { getChannelConfig } from '../../models/canal-channel.config';
import { MessagingService } from '../../services/messaging.service';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss'],
})
export class ConversationListComponent implements OnInit {

  @Input() channelType: TypeCanal = TypeCanal.WHATSAPP;
  @Output() conversationSelected = new EventEmitter<CanalDto>();

  canaux: CanalDto[] = [];
  loading = true;
  errorMessage: string | null = null;
  selectedId: string | null = null;

  constructor(private messaging: MessagingService) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    this.loading = true;
    this.errorMessage = null;

    this.messaging.listCanaux(this.channelType).subscribe({
      next: (list) => {
        this.canaux = [...list].sort((a, b) =>
          new Date(b.lastMessage?.createdAt ?? 0).getTime() -
          new Date(a.lastMessage?.createdAt ?? 0).getTime()
        );
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les conversations.';
        this.loading = false;
      },
    });
  }

  select(canal: CanalDto): void {
    this.selectedId = canal.externalId;
    this.conversationSelected.emit(canal);
  }

  channelIcon(canal: CanalDto): string {
    return getChannelConfig(canal.typeCanal).icon;
  }

  channelColor(canal: CanalDto): string {
    return getChannelConfig(canal.typeCanal).color;
  }

  previewText(canal: CanalDto): string {
    const msg = canal.lastMessage;
    if (!msg) return 'Aucun message';
    if (msg.text) return msg.fromMe ? `Vous: ${msg.text}` : msg.text;
    if (msg.hasAttachment) return msg.fromMe ? 'Vous: 📎 Pièce jointe' : '📎 Pièce jointe';
    return '...';
  }

  trackByExternalId(_index: number, canal: CanalDto): string {
    return canal.externalId;
  }
}
