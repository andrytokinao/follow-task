import { Component, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../avatar/avatar.component';
import {MessageDto, MessageDayGroup, IssueMessageLink} from '../../models/messaging.model';
import { groupMessagesByDay } from '../../utils/message-day-group.util';
import {MessageApp} from "../../type/issue";

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './message-thread.component.html',
  styleUrls: ['./message-thread.component.scss'],
})
export class MessageThreadComponent implements OnChanges {
  @Input() messages: MessageApp[] = [];
  @Input() isGroup = false;

  // Liens d'issues résolus par le parent : externalMessageId -> issues liées
  @Input() issueLinksByMessage: Map<string, IssueMessageLink[]> = new Map();

  @Output() linkIssueToMessage = new EventEmitter<MessageApp>();
  @Output() unlinkIssueFromMessage = new EventEmitter<IssueMessageLink>();

  dayGroups: MessageDayGroup[] = [];

  // Id du message dont le popover d'issue est ouvert
  openIssuePopoverFor: string | null = null;

  ngOnChanges(): void {
    // Les messages arrivent sous deux formes selon leur origine (DB locale
    // "MessageApp" avec `created`/`messageLinks`, ou provider live "Message"
    // avec `createdAt`/`attachments`/`fromMe`, sans `messageLinks`).
    // On normalise ici pour que le reste du composant n'ait plus à gérer
    // cette hétérogénéité.
    const normalized = this.messages.map(m => this.normalizeMessage(m));
    this.dayGroups = groupMessagesByDay(normalized);
  }

  private normalizeMessage(msg: any): MessageApp {
    return {
      ...msg,
      created: msg.created ?? msg.createdAt ?? null,
      messageLinks: msg.messageLinks ?? [],
      sender: msg.sender ?? null,
    };
  }

  // Ferme le popover au clic en dehors du composant. Les clics qui doivent
  // rester "internes" (ouverture depuis un chip, actions dans le popover)
  // appellent déjà $event.stopPropagation(), donc ils n'atteignent jamais
  // ce listener document.
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.openIssuePopoverFor !== null) {
      this.closeIssuePopover();
    }
  }

  shouldShowAvatar(msgs: MessageApp[], index: number): boolean {
    const current = msgs[index];
    if (this.isFromMe(current)) return false;

    // Sans sender résolu, pas d'id stable pour grouper les bulles
    // consécutives d'un même expéditeur -> on affiche l'avatar (avec le
    // fallback nom/photo) à chaque message plutôt que de risquer de le
    // masquer à tort entre deux personnes différentes.
    if (!current.sender) return true;

    if (!this.isGroup) {
      return index === 0;
    }
    if (index === 0) return true;
    const previous = msgs[index - 1];
    return this.senderKey(previous) !== this.senderKey(current);
  }

  private senderKey(msg: MessageApp): string {
    return msg.sender?.id != null
      ? String(msg.sender.id)
      : this.displayNameFor(msg);
  }

  // Nom affiché pour un message : sender résolu (User interne) en priorité,
  // sinon fallbackSenderName (champ typé, prévu pour ça côté "MessageApp"),
  // sinon senderDisplayName (champ brut du provider côté "Message"),
  // sinon "Inconnu". Sert aussi de base aux initiales générées par
  // app-avatar quand il n'y a pas de photo.
  displayNameFor(msg: MessageApp): string {
    return msg.sender?.firstName
      || msg.sender?.username
      || msg.fallbackSenderName
      || (msg as any).senderDisplayName
      || 'Inconnu';
  }

  avatarPhotoFor(msg: MessageApp): string | null {
    return msg.sender?.photo
      || (msg as any).senderAvatarUrl
      || null;
  }

  hasIssues(message: MessageApp): boolean {
    return (message.messageLinks ?? []).length > 0;
  }

  toggleIssuePopover(message: MessageApp, event: Event): void {
    event.stopPropagation();
    this.openIssuePopoverFor = this.openIssuePopoverFor === message.externalMessageId
      ? null
      : message.externalMessageId ?? null;
  }

  closeIssuePopover(): void {
    this.openIssuePopoverFor = null;
  }

  onLinkIssue(message: MessageApp, event: Event): void {
    event.stopPropagation();
    this.closeIssuePopover();
    this.linkIssueToMessage.emit(message);
  }

  onUnlinkIssue(link: IssueMessageLink, event: Event): void {
    event.stopPropagation();
    this.unlinkIssueFromMessage.emit(link);
    this.closeIssuePopover();
  }

  progressClass(percent: number | null | undefined): string {
    const p = percent ?? 0;
    if (p >= 70) return 'progress-high';
    if (p >= 30) return 'progress-mid';
    return 'progress-low';
  }

  isCompleted(link: IssueMessageLink): boolean {
    return (link.issue.completionPercent ?? 0) >= 100;
  }

  assigneeInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  protected isFromMe(msg: MessageApp): boolean {
    // Renvoyé directement par le provider live (typename "Message").
    // Pour les messages "MessageApp" (persistés en DB), ce champ n'existe
    // pas encore côté backend -> reste `false` en attendant de comparer
    // via l'utilisateur courant.
    return !!(msg as any).fromMe;
  }

  protected hasAttachment(msg: MessageApp): boolean {
    return !!(msg as any).hasAttachment || !!(msg as any).attachments?.length;
  }
}
