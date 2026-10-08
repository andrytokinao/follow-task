import {Injectable, Type} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {FileViewerData} from './file-viewer-data';

/**
 * Chaque visionneuse est chargée par import dynamique : elle forme un chunk séparé,
 * téléchargé au premier fichier de ce type ouvert, puis gardé en cache.
 * Aucune n'est importée statiquement, sinon elle retomberait dans le bundle commun.
 */
const VIEWERS: Record<string, () => Promise<Type<unknown>>> = {
  pdf: () => import('../pdf-viewer-dialog/pdf-viewer-dialog.component').then(m => m.PdfViewerDialogComponent),
  docx: () => import('../docx-viewer-dialog/docx-viewer-dialog.component').then(m => m.DocxViewerDialogComponent),
};

/** Ouvre un aperçu de fichier en popup plein écran (PDF, DOCX). */
@Injectable({providedIn: 'root'})
export class FileViewerService {

  private chunks = new Map<string, Promise<Type<unknown>>>();

  constructor(private readonly dialog: MatDialog) {
  }

  /** Vrai si un aperçu existe pour ce type de fichier. */
  canPreview(fileName: string): boolean {
    return !!VIEWERS[this.extension(fileName)];
  }

  /** Télécharge la visionneuse en avance (ex. au survol) pour que l'ouverture soit immédiate. */
  preload(fileName: string): void {
    this.load(this.extension(fileName))?.catch(() => {});
  }

  async open(file: FileViewerData): Promise<void> {
    const viewer = this.load(this.extension(file.fileName));
    if (!viewer) {
      return;
    }
    this.dialog.open(await viewer, {
      data: file,
      // Plein écran : Material plafonne sinon la largeur à 80vw.
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      panelClass: 'file-viewer-dialog-panel',
      autoFocus: false,
    });
  }

  private load(extension: string): Promise<Type<unknown>> | null {
    if (!VIEWERS[extension]) {
      return null;
    }
    if (!this.chunks.has(extension)) {
      const chunk = VIEWERS[extension]();
      // En cas d'échec réseau, on autorise une nouvelle tentative.
      chunk.catch(() => this.chunks.delete(extension));
      this.chunks.set(extension, chunk);
    }
    return this.chunks.get(extension);
  }

  private extension(fileName: string): string {
    return fileName?.split('.').pop()?.toLowerCase() ?? '';
  }
}
