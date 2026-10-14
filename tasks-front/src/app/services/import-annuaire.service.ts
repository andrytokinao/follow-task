import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {ApercuImportAnnuaire, DemandeImportAnnuaire} from '../type/import-annuaire';
import {RapportImportUsers} from '../type/import-users';

/**
 * Import d'utilisateurs depuis un annuaire externe, en deux temps : aperçu
 * (lecture des fiches et doublons, rien n'est créé), puis import.
 */
@Injectable({
  providedIn: 'root',
})
export class ImportAnnuaireService {

  private apiUrl = environment.apiURL + 'api/users/import/annuaire';

  constructor(private http: HttpClient) {
  }

  apercu(references: string[]): Observable<ApercuImportAnnuaire[]> {
    return this.http.post<ApercuImportAnnuaire[]>(`${this.apiUrl}/apercu`, references,
      {withCredentials: true});
  }

  /** Répond 200 même si des fiches sont ignorées ou rejetées : voir le rapport. */
  importer(demande: DemandeImportAnnuaire): Observable<RapportImportUsers> {
    return this.http.post<RapportImportUsers>(this.apiUrl, demande, {withCredentials: true});
  }
}
