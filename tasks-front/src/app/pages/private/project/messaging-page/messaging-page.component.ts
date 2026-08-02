// src/app/pages/messaging-page/messaging-page.component.ts

import { Component, OnInit } from '@angular/core';
import { MessagingService } from '../../../../services/messaging.service';
import { MessageCacheService } from '../../../../services/message-cache.service';
import { AttachmentDto, CanalDto, MessageDto, SendMessageRequest, TypeCanal } from '../../../../models/messaging.model';
import { getChannelConfig } from '../../../../models/canal-channel.config';

@Component({
  selector: 'app-messaging-page',
  standalone: false,
  templateUrl: './messaging-page.component.html',
  styleUrls: ['./messaging-page.component.scss'],
})
export class MessagingPageComponent implements OnInit {

  channelType: TypeCanal = TypeCanal.WHATSAPP;

  canaux: CanalDto[] = [];
  filteredCanaux: CanalDto[] = [];
  searchTerm = '';
  loadingList = true;
  listError: string | null = null;

  activeCanal: CanalDto | null = null;
  messages: MessageDto[] = [];
  loadingMessages = false;
  messagesError: string | null = null;
  draftText = '';
  sending = false;

  // Détail canal (colonne droite)
  canalDetail: CanalDto | null = null;
  loadingDetail = false;
  showInfoPanel = true;

  showMembersList = false;

  attachments: AttachmentDto[] = [];
  loadingAttachments = false;
  attachmentsError: string | null = null;
  showAttachmentsList = false;

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
      error: (err) => {
        console.error('Erreur listCanaux:', err);
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
    this.messagesError = null;

    // Repli systématique des sections dépliables à chaque nouvelle conversation
    this.showMembersList = false;
    this.attachments = [];
    this.attachmentsError = null;
    this.showAttachmentsList = false;

    try {
      const cached = await this.cache.getMessages(canal.externalId);
      this.messages = cached;
      this.loadingMessages = cached.length === 0;
    } catch (err) {
      console.error('Erreur lecture cache:', err);
      this.loadingMessages = true;
    }

    let since: string | undefined;
    try {
      since = (await this.cache.getLastCachedDate(canal.externalId)) ?? undefined;
    } catch {
      since = undefined;
    }

    this.messaging.listMessages(this.channelType, canal.externalId, { since }).subscribe({
      next: async (fresh) => {
        try {
          await this.cache.saveMessages(fresh);
          this.messages = await this.cache.getMessages(canal.externalId);
        } catch (err) {
          console.error('Erreur écriture cache:', err);
          this.messages = fresh;
        }
        this.loadingMessages = false;
        canal.unreadCount = 0;
      },
      error: (err) => {
        console.error('Erreur listMessages:', err);
        this.messagesError = 'Impossible de charger les messages.';
        this.loadingMessages = false;
      },
    });

    this.loadCanalDetail(canal.externalId);
  }

  loadCanalDetail(externalId: string): void {
    this.loadingDetail = true;
    this.messaging.getCanal(this.channelType, externalId).subscribe({
      next: (detail) => {
        this.canalDetail = detail;
        this.loadingDetail = false;
      },
      error: (err) => {
        console.error('Erreur getCanal:', err);
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
        try {
          await this.cache.saveMessages([sent]);
          this.messages = await this.cache.getMessages(this.activeCanal!.externalId);
        } catch {
          this.messages = [...this.messages, sent];
        }
        this.draftText = '';
        this.sending = false;
      },
      error: (err) => {
        console.error('Erreur sendMessage:', err);
        this.sending = false;
      },
    });
  }

  // ---------------------------------------------------------------------
  // Colonne droite : panneau, membres, fichiers
  // ---------------------------------------------------------------------

  toggleInfoPanel(): void {
    this.showInfoPanel = !this.showInfoPanel;
  }

  toggleMembersList(): void {
    this.showMembersList = !this.showMembersList;
  }

  toggleAttachmentsList(): void {
    this.showAttachmentsList = !this.showAttachmentsList;
    if (this.showAttachmentsList && this.attachments.length === 0 && !this.attachmentsError) {
      this.loadAttachments();
    }
  }

  loadAttachments(): void {
    if (!this.activeCanal) return;
    this.loadingAttachments = true;
    this.attachmentsError = null;

    this.messaging.listAttachments(this.channelType, this.activeCanal.externalId).subscribe({
      next: (list) => {
        this.attachments = list;
        this.loadingAttachments = false;
      },
      error: (err) => {
        console.error('Erreur listAttachments:', err);
        this.attachmentsError = 'Impossible de charger les fichiers.';
        this.loadingAttachments = false;
      },
    });
  }

  formatSize(bytes: number | null | undefined): string {
    if (!bytes) return '';
    return (bytes / 1024 / 1024).toFixed(1) + ' Mo';
  }

  attachmentIconClass(att: AttachmentDto): Record<string, boolean> {
    return {
      'fa-file-image': att.mediaType === 'IMAGE',
      'fa-file-video': att.mediaType === 'VIDEO',
      'fa-file-audio': att.mediaType === 'AUDIO',
      'fa-file-lines': att.mediaType === 'DOCUMENT' || !att.mediaType,
    };
  }

  syncActiveCanal(): void {
    this.messaging.syncCanal(this.channelType).subscribe({
      next: () => {
        this.loadConversations();
        if (this.activeCanal) this.openConversation(this.activeCanal);
      },
      error: (err) => console.error('Erreur syncCanal:', err),
    });
  }
}
