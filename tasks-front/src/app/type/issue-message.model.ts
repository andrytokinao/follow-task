// models/issue-message.model.ts

export type MediaType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'SYSTEM' | 'UNKNOWN';

export interface IssueMessageDto {
  id: number;
  externalMessageId: string;
  text: string;
  mediaType: MediaType;
  senderId: number | null;
  senderDisplayName: string;
  fromMe: boolean;
  createdAt: string;
}

export interface IssueCanalMessagesDto {
  canalId: number;
  canalPseudo: string;
  typeCanal: string;
  linkMode: 'FULL_CANAL' | 'SELECTED_MESSAGES';
  messages: IssueMessageDto[];
}
