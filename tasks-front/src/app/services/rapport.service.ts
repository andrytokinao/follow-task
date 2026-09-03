import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {RapportProjetDTO} from '../type/rapport';

/**
 * Rapport d'avancement d'un projet.
 *
 * Le serveur est seul à savoir agréger les événements de planning d'une demande
 * et de ses tâches : le rapport n'est donc jamais reconstruit ici, on consomme
 * le DTO tel quel. Le PDF est produit par le même service côté serveur, à
 * partir des mêmes données que l'aperçu.
 */
@Injectable({providedIn: 'root'})
export class RapportService {

  private readonly baseUrl = environment.apiURL + 'api/rapports';

  constructor(private http: HttpClient) {
  }

  /** Données du rapport, pour l'aperçu natif. */
  obtenirRapport(issueId: number): Observable<RapportProjetDTO> {
    return this.http.get<RapportProjetDTO>(`${this.baseUrl}/${issueId}`, {withCredentials: true});
  }

  /** Télécharge le PDF et déclenche l'enregistrement du fichier. */
  telechargerPdf(issueId: number): void {
    this.http.get(`${this.baseUrl}/${issueId}/pdf`, {
      responseType: 'blob',
      observe: 'response',
      withCredentials: true
    }).subscribe(response => {
      const blob = response.body;
      if (!blob) {
        return;
      }
      this.saveAs(blob, this.fileNameOf(response.headers.get('Content-Disposition'), issueId));
    });
  }

  /**
   * Le serveur nomme le fichier d'après la clé de la demande, que le client
   * n'a pas toujours sous la main : on reprend le nom qu'il annonce.
   */
  private fileNameOf(disposition: string | null, issueId: number): string {
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition ?? '');
    const name = match ? decodeURIComponent(match[1].trim()) : '';
    return name || `rapport-${issueId}.pdf`;
  }

  private saveAs(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Révoquer tout de suite couperait le téléchargement dans Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
