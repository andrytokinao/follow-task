import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import type {PdfViewerDialogData} from './pdf-viewer-dialog.component';

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

  async open(pdf: PdfViewerDialogData): Promise<void> {
    const {PdfViewerDialogComponent} = await this.load();
    this.dialog.open(PdfViewerDialogComponent, {
      data: pdf,
      // Plein écran : Material plafonne sinon la largeur à 80vw.
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      panelClass: 'pdf-viewer-dialog-panel',
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
