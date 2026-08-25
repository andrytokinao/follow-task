// src/app/models/messaging.model.ts

export enum TypeCanal {
  PROJECT = 'PROJECT',
  ISSUE = 'ISSUE',
  DEFAULT = 'DEFAULT',
  WHATSAPP = 'WHATSAPP',
  FACEBOOK = 'FACEBOOK',
  TELEGRAM = 'TELEGRAM',
  INSTAGRAM = 'INSTAGRAM',
  SLACK = 'SLACK',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export enum MediaType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN',
}

export interface MemberDto {
  externalUserId: string;
  displayName: string | null;
  phoneOrContact: string | null;
  admin: boolean;
  contactId?: string | null;   // rempli si le contact est résolu côté back
  userAppId?: string | null;   // rempli si le contact est rattaché à un utilisateur interne
}

export interface CanalDto {
  externalId: string;
  pseudo: string;
  typeCanal: TypeCanal;
  isGroup: boolean;
  unreadCount: number;
  messageCount: number;
  description?: string | null;
  ownerExternalId?: string | null;
  memberCount?: number;
  members?: MemberDto[];
  lastMessage?: MessageDto | null;
  avatarUrl?: string | null;
}
export interface AttachmentDto {
  externalMessageId: string;
  externalAttachmentId?: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  caption: string | null;
  mediaType: MediaType;
  senderExternalId: string | null;
  fromMe: boolean;
  downloaded: boolean;
  downloadUrl: string | null;
  createdAt: string; // ISO string côté front
}

export interface MessageDto {
  externalMessageId: string;
  canalExternalId: string;
  text: string | null;
  mediaType: MediaType;
  senderExternalId: string | null;
  senderDisplayName: string | null;
  senderAvatarUrl?: string | null;
  createdAt: string;
  fromMe: boolean;
  hasAttachment: boolean;
  attachments: AttachmentDto[];
}

export interface SendMessageRequest {
  text: string;
  mediaUrl?: string;
  mediaType?: MediaType;
}

export interface MessageQuery {
  page: number;
  size: number;
  since?: string;
  until?: string;
}

/** Groupe de messages par jour, pour l'affichage style WhatsApp. */
export interface MessageDayGroup {
  dateLabel: string;
  isoDate: string;
  messages: MessageDto[];
}

// =====================================================================
// Liaison Issue (Canal / Message <-> Issue de suivi projet)
// =====================================================================

export enum IssueStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export interface IssueDto {
  key: string;                     // ex: "PROJ-123"
  summary: string;
  description?: string | null;
  status?: IssueStatus;
  completionPercent?: number;      // 0-100
  url?: string | null;
  assignee?: string | null;        // nom du responsable (donnée fictive pour le design)
}

export type IssueTargetType = 'CANAL' | 'MESSAGE';

export interface IssueLinkDto {
  id: string;
  issue: IssueDto;
  targetType: IssueTargetType;
  targetId: string;                // CanalDto.externalId ou MessageDto.externalMessageId
  linkedAt: string;                // ISO string
  linkedBy?: string | null;
}

export interface LinkIssueRequest {
  targetType: IssueTargetType;
  targetId: string;
  issueKey: string;
}
