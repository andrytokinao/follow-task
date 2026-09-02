import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, map} from 'rxjs';
import {environment} from '../../environments/environment';

export interface IssueExportRequest {
  issueIds: number[];
  /** Clés de colonnes, dans l'ordre voulu. `cf-<id>` pour un champ personnalisé. */
  columns: string[];
  sheetName?: string;
  includeSubtasks?: boolean;
}

/**
 * Export Excel produit par le serveur.
 *
 * Le classeur n'est plus fabriqué dans le navigateur : les heures d'exécution
 * se calculent à partir de tous les événements de planning d'une demande et de
 * ses sous-tâches, que le client n'a pas en mémoire.
 */
@Injectable({providedIn: 'root'})
export class ExportService {

  constructor(private http: HttpClient) {
  }

  /** Télécharge le classeur et déclenche l'enregistrement du fichier. */
  downloadIssues(request: IssueExportRequest, fileName: string): Observable<void> {
    const url = `${environment.apiURL}api/export/issues?fileName=${encodeURIComponent(fileName)}`;
    return this.http.post(url, request, {
      responseType: 'blob',
      observe: 'response',
      withCredentials: true
    }).pipe(map(response => {
      const blob = response.body;
      if (!blob) {
        throw new Error('Réponse vide');
      }
      this.saveAs(blob, this.fileNameOf(response.headers.get('Content-Disposition'), fileName));
    }));
  }

  /**
   * Le serveur horodate le fichier : on reprend le nom qu'il annonce plutôt que
   * d'en reconstruire un ici, sinon les deux se contrediraient.
   */
  private fileNameOf(disposition: string | null, fallback: string): string {
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition ?? '');
    const name = match ? decodeURIComponent(match[1].trim()) : '';
    if (name) {
      return name;
    }
    return fallback.toLowerCase().endsWith('.xlsx') ? fallback : `${fallback}.xlsx`;
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
