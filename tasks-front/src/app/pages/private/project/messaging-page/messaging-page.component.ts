// src/app/pages/messaging-page/messaging-page.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {MessagingService} from "../../../../services/messaging.service";
import {MessageCacheService} from "../../../../services/message-cache.service";
import {CanalDto, MessageDto, SendMessageRequest, TypeCanal} from "../../../../models/messaging.model";
import {MessageThreadComponent} from "../../../../common/message-thread/message-thread.component";
import {AvatarComponent} from "../../../../common/avatar/avatar.component";
import {getChannelConfig} from "../../../../models/canal-channel.config";



@Component({
  selector: 'app-messaging-page',
  standalone: false,
  templateUrl: './messaging-page.component.html',
  styleUrls: ['./messaging-page.component.scss'],
})
export class MessagingPageComponent implements OnInit {

  channelType: TypeCanal = TypeCanal.WHATSAPP;

  // Liste (colonne gauche)
  canaux: CanalDto[] = [];
  filteredCanaux: CanalDto[] = [];
  searchTerm = '';
  loadingList = true;
  listError: string | null = null;

  // Conversation active (colonne centrale)
  activeCanal: CanalDto | null = null;
  messages: MessageDto[] = [];
  loadingMessages = false;
  draftText = '';
  sending = false;

  // Détail canal (colonne droite)
  canalDetail: CanalDto | null = null;
  loadingDetail = false;

  showInfoPanel = true;

  constructor(
    private messaging: MessagingService,
    private cache: MessageCacheService,
  ) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  // ---------------------------------------------------------------------
  // Colonne gauche : liste + filtre
  // ---------------------------------------------------------------------

  loadConversations(): void {
    this.loadingList = true;
    this.listError = null;

    this.messaging.listCanaux(this.channelType).subscribe({
      next: (list) => {
        this.canaux = [...list].sort((a, b) =>
          new Date(b.lastMessage?.createdAt ?? 0).getTime() -
          new Date(a.lastMessage?.createdAt ?? 0).getTime()
        );
        this.applyFilter();
        this.loadingList = false;
      },
      error: () => {
        this.listError = 'Impossible de charger les conversations.';
        this.loadingList = false;
      },
    });
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredCanaux = !term
      ? this.canaux
      : this.canaux.filter(c => c.pseudo?.toLowerCase().includes(term));
  }

  trackByExternalId(_i: number, canal: CanalDto): string {
    return canal.externalId;
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

  // ---------------------------------------------------------------------
  // Colonne centrale : ouverture d'une conversation
  // ---------------------------------------------------------------------

  async openConversation(canal: CanalDto): Promise<void> {
    this.activeCanal = canal;
    this.messages = [];
    this.canalDetail = null;

    // 1. Affichage immédiat depuis le cache local (perception de rapidité)
    const cached = await this.cache.getMessages(canal.externalId);
    this.messages = cached;
    this.loadingMessages = cached.length === 0;

    // 2. Récupération du delta réseau (uniquement les messages postérieurs au cache)
    const since = await this.cache.getLastCachedDate(canal.externalId) ?? undefined;
    this.messaging.listMessages(this.channelType, canal.externalId, { since }).subscribe({
      next: async (fresh) => {
        await this.cache.saveMessages(fresh);
        this.messages = await this.cache.getMessages(canal.externalId);
        this.loadingMessages = false;

        // Marquer comme lu localement (optimiste, tant que pas de mutation dédiée)
        canal.unreadCount = 0;
      },
      error: () => {
        this.loadingMessages = false;
      },
    });

    // 3. Détail du canal (membres, description...) pour la colonne droite
    this.loadCanalDetail(canal.externalId);
  }

  loadCanalDetail(externalId: string): void {
    this.loadingDetail = true;
    this.messaging.getCanal(this.channelType, externalId).subscribe({
      next: (detail) => {
        this.canalDetail = detail;
        this.loadingDetail = false;
      },
      error: () => {
        this.loadingDetail = false;
      },
    });
  }

  sendMessage(): void {
    const text = this.draftText.trim();
    if (!text || !this.activeCanal || this.sending) return;

    this.sending = true;
    const request: SendMessageRequest = { text };

    this.messaging.sendMessage(this.channelType, this.activeCanal.externalId, request).subscribe({
      next: async (sent) => {
        await this.cache.saveMessages([sent]);
        this.messages = await this.cache.getMessages(this.activeCanal!.externalId);
        this.draftText = '';
        this.sending = false;
      },
      error: () => {
        this.sending = false;
      },
    });
  }

  // ---------------------------------------------------------------------
  // Colonne droite
  // ---------------------------------------------------------------------

  toggleInfoPanel(): void {
    this.showInfoPanel = !this.showInfoPanel;
  }

  syncActiveCanal(): void {
    this.messaging.syncCanal(this.channelType).subscribe(() => {
      this.loadConversations();
      if (this.activeCanal) this.openConversation(this.activeCanal);
    });
  }
}
