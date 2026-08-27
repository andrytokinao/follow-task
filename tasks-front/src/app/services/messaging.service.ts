// src/app/services/messaging.service.ts

import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';

import {
  LIST_CANAUX,
  GET_CANAL,
  LIST_MESSAGES,
  GET_MESSAGE,
  SEND_EXTERNAL_MESSAGE,
  LIST_ATTACHMENTS,
  SYNC_CANAL,
  LIST_VISIBLE_CANAUX_FOR_USER,
  GRANT_CANAL_ACCESS,
  REVOKE_CANAL_ACCESS,
  LINK_ISSUE_TO_MESSAGE,
  UNLINK_ISSUE_FROM_MESSAGE,
  LINK_ISSUE_TO_CANAL,
  UNLINK_ISSUE_FROM_CANAL, LIST_MESSAGES_ENTITY,
} from '../type/graphql.operations';

import {
  CanalDto,
  MessageDto,
  AttachmentDto,
  MessageQuery,
  SendMessageRequest,
  TypeCanal,
  IssueMessageLink,
  IssueCanalLink,
} from '../models/messaging.model';

import { CanallInterne, CanalWatcherInfo } from '../models/canal-watcher.model';
import {MessageApp} from "../type/issue";

@Injectable({ providedIn: 'root' })
export class MessagingService {

  constructor(private apollo: Apollo) {}

  // ---------------------------------------------------------------------
  // Canaux (provider externe : WhatsApp, Facebook, ...)
  // ---------------------------------------------------------------------

  listCanaux(type: TypeCanal): Observable<CanalDto[]> {
    return this.apollo.watchQuery<{ listCanaux: CanalDto[] }>({
      query: LIST_CANAUX,
      variables: { type },
      fetchPolicy: 'cache-and-network',
    }).valueChanges.pipe(map(r => r.data.listCanaux));
  }

  getCanal(type: TypeCanal, externalId: string): Observable<CanalDto> {
    return this.apollo.query<{ getCanal: CanalDto }>({
      query: GET_CANAL,
      variables: { type, externalId },
      fetchPolicy: 'network-only',
    }).pipe(map(r => r.data.getCanal));
  }

  // ---------------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------------

  listMessages(type: TypeCanal, canalExternalId: string, query: Partial<MessageQuery> = {}): Observable<MessageDto[]> {
    return this.apollo.query<{ listMessages: MessageDto[] }>({
      query: LIST_MESSAGES,
      variables: { type, canalExternalId, query: { page: 0, size: 50, ...query } },
      fetchPolicy: 'network-only',
    }).pipe(map(r => r.data.listMessages));
  }
  listMessagesEntity(type: TypeCanal, canalExternalId: string, query: Partial<MessageQuery> = {}): Observable<MessageApp[]> {
    return this.apollo.query<{ listMessagesEntity: MessageApp[] }>({
      query: LIST_MESSAGES_ENTITY,
      variables: { type, canalExternalId, query: { page: 0, size: 50, ...query } },
      fetchPolicy: 'network-only',
    }).pipe(map(r => r.data.listMessagesEntity));
  }

  getMessage(type: TypeCanal, externalMessageId: string): Observable<MessageDto> {
    return this.apollo.query<{ getMessage: MessageDto }>({
      query: GET_MESSAGE,
      variables: { type, externalMessageId },
      fetchPolicy: 'network-only',
    }).pipe(map(r => r.data.getMessage));
  }

  sendMessage(type: TypeCanal, canalExternalId: string, input: SendMessageRequest): Observable<MessageDto> {
    return this.apollo.mutate<{ sendExternalMessage: MessageDto }>({
      mutation: SEND_EXTERNAL_MESSAGE,
      variables: { type, canalExternalId, input },
    }).pipe(map(r => r.data!.sendExternalMessage));
  }

  // ---------------------------------------------------------------------
  // Pièces jointes
  // ---------------------------------------------------------------------

  listAttachments(type: TypeCanal, canalExternalId: string): Observable<AttachmentDto[]> {
    return this.apollo.query<{ listAttachments: AttachmentDto[] }>({
      query: LIST_ATTACHMENTS,
      variables: { type, canalExternalId },
      fetchPolicy: 'network-only',
    }).pipe(map(r => r.data.listAttachments));
  }

  // ---------------------------------------------------------------------
  // Synchronisation
  // ---------------------------------------------------------------------

  syncCanal(type: TypeCanal): Observable<boolean> {
    return this.apollo.mutate<{ syncCanal: boolean }>({
      mutation: SYNC_CANAL,
      variables: { type },
    }).pipe(map(r => !!r.data?.syncCanal));
  }

  // ---------------------------------------------------------------------
  // Accès interne aux canaux (CanalWatcher)
  // ---------------------------------------------------------------------

  listVisibleCanauxForUser(userId: string): Observable<CanallInterne[]> {
    return this.apollo.query<{ listVisibleCanauxForUser: CanallInterne[] }>({
      query: LIST_VISIBLE_CANAUX_FOR_USER,
      variables: { userId },
      fetchPolicy: 'network-only',
    }).pipe(map(r => r.data.listVisibleCanauxForUser));
  }

  grantCanalAccess(canalId: string, userId: string, reason?: string): Observable<CanalWatcherInfo> {
    return this.apollo.mutate<{ grantCanalAccess: CanalWatcherInfo }>({
      mutation: GRANT_CANAL_ACCESS,
      variables: { canalId, userId, reason },
    }).pipe(map(r => r.data!.grantCanalAccess));
  }

  revokeCanalAccess(canalId: string, userId: string): Observable<boolean> {
    return this.apollo.mutate<{ revokeCanalAccess: boolean }>({
      mutation: REVOKE_CANAL_ACCESS,
      variables: { canalId, userId },
    }).pipe(map(r => !!r.data?.revokeCanalAccess));
  }

  // ---------------------------------------------------------------------
  // Liaison Issue <-> Canal / Message
  // ---------------------------------------------------------------------

  linkIssueToMessage(issueId: number, externalMessageId: string): Observable<IssueMessageLink> {
    return this.apollo.mutate<{ linkIssueToMessage: IssueMessageLink }>({
      mutation: LINK_ISSUE_TO_MESSAGE,
      variables: { issueId, externalMessageId },
    }).pipe(map(r => r.data!.linkIssueToMessage));
  }

  unlinkIssueFromMessage(linkId: string): Observable<boolean> {
    return this.apollo.mutate<{ unlinkIssueFromMessage: boolean }>({
      mutation: UNLINK_ISSUE_FROM_MESSAGE,
      variables: { linkId },
    }).pipe(map(r => !!r.data?.unlinkIssueFromMessage));
  }

  linkIssueToCanal(issueId: number, canalExternalId: string): Observable<IssueCanalLink> {
    return this.apollo.mutate<{ linkIssueToCanal: IssueCanalLink }>({
      mutation: LINK_ISSUE_TO_CANAL,
      variables: { issueId, canalExternalId },
    }).pipe(map(r => r.data!.linkIssueToCanal));
  }

  unlinkIssueFromCanal(linkId: number): Observable<boolean> {
    return this.apollo.mutate<{ unlinkIssueFromCanal: boolean }>({
      mutation: UNLINK_ISSUE_FROM_CANAL,
      variables: { linkId },
    }).pipe(map(r => !!r.data?.unlinkIssueFromCanal));
  }
}
