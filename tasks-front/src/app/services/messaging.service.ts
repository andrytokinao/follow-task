// src/app/services/messaging.service.ts

import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  LIST_CANAUX, GET_CANAL, LIST_MESSAGES, SEND_MESSAGE, LIST_ATTACHMENTS, SYNC_CANAL,
} from '../type/graphql.operations';
import {
  CanalDto, MessageDto, AttachmentDto, MessageQuery, SendMessageRequest, TypeCanal,
} from '../models/messaging.model';

@Injectable({ providedIn: 'root' })
export class MessagingService {

  constructor(private apollo: Apollo) {}

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

  listMessages(type: TypeCanal, canalExternalId: string, query: Partial<MessageQuery> = {}): Observable<MessageDto[]> {
    return this.apollo.query<{ listMessages: MessageDto[] }>({
      query: LIST_MESSAGES,
      variables: { type, canalExternalId, query: { page: 0, size: 50, ...query } },
      fetchPolicy: 'network-only',
    }).pipe(map(r => r.data.listMessages));
  }

  sendMessage(type: TypeCanal, canalExternalId: string, input: SendMessageRequest): Observable<MessageDto> {
    return this.apollo.mutate<{ sendMessage: MessageDto }>({
      mutation: SEND_MESSAGE,
      variables: { type, canalExternalId, input },
    }).pipe(map(r => r.data!.sendMessage));
  }

  listAttachments(type: TypeCanal, canalExternalId: string): Observable<AttachmentDto[]> {
    return this.apollo.query<{ listAttachments: AttachmentDto[] }>({
      query: LIST_ATTACHMENTS,
      variables: { type, canalExternalId },
      fetchPolicy: 'network-only',
    }).pipe(map(r => r.data.listAttachments));
  }

  syncCanal(type: TypeCanal): Observable<boolean> {
    return this.apollo.mutate<{ syncCanal: boolean }>({
      mutation: SYNC_CANAL,
      variables: { type },
    }).pipe(map(r => !!r.data?.syncCanal));
  }
}
