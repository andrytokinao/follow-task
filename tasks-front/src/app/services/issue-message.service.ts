// services/issue-message.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../environments/environment";
import {IssueCanalMessagesDto} from "../type/issue-message.model";

@Injectable({ providedIn: 'root' })
export class IssueMessageService {

  private readonly baseUrl = environment.apiURL+'api/issues';

  constructor(private http: HttpClient) {}

  getMessages(issueId: number): Observable<IssueCanalMessagesDto[]> {
    return this.http.get<IssueCanalMessagesDto[]>(`${this.baseUrl}/${issueId}/messages`);
  }

  linkCanal(issueId: number, canalId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${issueId}/canals/${canalId}/link`, {});
  }

  unlinkCanal(issueId: number, canalId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${issueId}/canals/${canalId}/link`);
  }

  linkMessage(issueId: number, messageId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${issueId}/messages/${messageId}/link`, {});
  }

  linkMessageByExternalId(issueId: number, type: string, externalMessageId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${issueId}/messages/external/${type}/${externalMessageId}/link`, {}
    );
  }
}
