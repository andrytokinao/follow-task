import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../avatar/avatar.component';
import { MessageDto, MessageDayGroup } from '../../models/messaging.model';
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
  @Input() isGroup = false; // en 1-to-1, pas besoin d'afficher l'avatar à chaque message

  dayGroups: MessageDayGroup[] = [];

  ngOnChanges() {
    this.dayGroups = groupMessagesByDay(this.messages);
  }

  shouldShowAvatar(msgs: MessageDto[], index: number): boolean {
    if (msgs[index].fromMe) return false;
    if (!this.isGroup) return index === 0 || msgs[index - 1].fromMe;
    return index === 0 || msgs[index - 1].senderExternalId !== msgs[index].senderExternalId;
  }
}
