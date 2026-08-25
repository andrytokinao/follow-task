import { Component, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../avatar/avatar.component';
import {MessageDto, MessageDayGroup, IssueMessageLink} from '../../models/messaging.model';
import { groupMessagesByDay } from '../../utils/message-day-group.util';

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './message-thread.component.html',
  styleUrls: ['./message-thread.component.scss'],
})
export class MessageThreadComponent implements OnChanges {
  @Input() messages: MessageDto[] = [];
  @Input() isGroup = false;

  // Liens d'issues résolus par le parent : externalMessageId -> issues liées
  @Input() issueLinksByMessage: Map<string, IssueMessageLink[]> = new Map();

  @Output() linkIssueToMessage = new EventEmitter<MessageDto>();
  @Output() unlinkIssueFromMessage = new EventEmitter<IssueMessageLink>();

  dayGroups: MessageDayGroup[] = [];

  // Id du message dont le popover d'issue est ouvert
  openIssuePopoverFor: string | null = null;

  ngOnChanges(): void {
    this.dayGroups = groupMessagesByDay(this.messages);
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

  shouldShowAvatar(msgs: MessageDto[], index: number): boolean {
    if (msgs[index].fromMe) return false;
    if (!this.isGroup) return index === 0 || msgs[index - 1].fromMe;
    return index === 0 || msgs[index - 1].senderExternalId !== msgs[index].senderExternalId;
  }

  getMessageIssues(message: MessageDto): IssueMessageLink[] {
    return this.issueLinksByMessage.get(message.externalMessageId) ?? [];
  }

  hasIssues(message: MessageDto): boolean {
    return this.getMessageIssues(message).length > 0;
  }

  toggleIssuePopover(message: MessageDto, event: Event): void {
    event.stopPropagation();
    this.openIssuePopoverFor = this.openIssuePopoverFor === message.externalMessageId
      ? null
      : message.externalMessageId;
  }

  closeIssuePopover(): void {
    this.openIssuePopoverFor = null;
  }

  onLinkIssue(message: MessageDto, event: Event): void {
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
}
