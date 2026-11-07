import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import { environment } from '../../environments/environment';

export interface LinkCodeResponse {
  /** Code affiché, ex. "483 921" */
  code: string;
  expiresAt: string;
  /** Lien wa.me prêt à ouvrir, ex. https://wa.me/261340568013?text=483921 */
  link: string;
  /** Durée de validité restante, en secondes */
  expiresInSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class ContactsService {

  private readonly baseUrl: string = environment.apiURL;

  constructor(private http: HttpClient) {
  }

  /** Génère le code de liaison, ou renvoie celui encore valide. */
  generateWhatsAppLinkCode(): Observable<LinkCodeResponse> {
    return this.http.post<any>(
      `${this.baseUrl}api/contacts/link-code`, null, {params: {type: 'WHATSAPP'}}
    ).pipe(
      map(r => ({
        code: r.code ?? r.affichage ?? '',
        expiresAt: r.expiresAt ?? '',
        link: r.waLink ?? '',
        expiresInSeconds: Number(r.expiresInSeconds ?? 300),
      }))
    );
  }
}
