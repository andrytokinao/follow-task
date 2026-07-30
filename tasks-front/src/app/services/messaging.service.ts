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
} from '../type/graphql.operations';

import {
  CanalDto,
  MessageDto,
  AttachmentDto,
  MessageQuery,
  SendMessageRequest,
  TypeCanal,
} from '../models/messaging.model';

import { CanallInterne, CanalWatcherInfo } from '../models/canal-watcher.model';

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
}
