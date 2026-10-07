import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Uploaded} from '../../type/issue';

type PdfViewerDialogChunk = typeof import('./pdf-viewer-dialog.component');

/**
 * Ouvre un PDF dans une popup.
 *
 * Le composant n'est jamais importé statiquement : l'import dynamique en fait un chunk
 * séparé, téléchargé au premier PDF ouvert puis gardé en cache.
 */
@Injectable({providedIn: 'root'})
export class PdfViewerService {

  private chunk: Promise<PdfViewerDialogChunk> | null = null;

  constructor(private readonly dialog: MatDialog) {
  }

  /** Télécharge le viewer en avance (ex. au survol d'un PDF) pour que l'ouverture soit immédiate. */
  preload(): void {
    this.load().catch(() => {});
  }

  async open(uploaded: Uploaded): Promise<void> {
    const {PdfViewerDialogComponent} = await this.load();
    this.dialog.open(PdfViewerDialogComponent, {
      data: {uploaded},
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      autoFocus: false,
    });
  }

  private load(): Promise<PdfViewerDialogChunk> {
    if (!this.chunk) {
      this.chunk = import('./pdf-viewer-dialog.component');
      // En cas d'échec réseau, on autorise une nouvelle tentative.
      this.chunk.catch(() => this.chunk = null);
    }
    return this.chunk;
  }
}
