import {Component, DestroyRef, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {NgxExtendedPdfViewerModule} from 'ngx-extended-pdf-viewer';
import {environment} from '../../../environments/environment';
import {FileViewerData} from '../file-viewer/file-viewer-data';

/**
 * Visionneuse PDF en popup.
 *
 * Composant standalone pour être chargé à la demande par le {@link FileViewerService} :
 * ngx-extended-pdf-viewer n'entre ainsi dans aucun module partagé et n'alourdit pas
 * le chargement de l'application.
 */
@Component({
  standalone: true,
  selector: 'app-pdf-viewer-dialog',
  imports: [CommonModule, MatDialogModule, NgxExtendedPdfViewerModule],
  templateUrl: './pdf-viewer-dialog.component.html',
  styleUrls: ['./pdf-viewer-dialog.component.css'],
})
export class PdfViewerDialogComponent implements OnInit {

  /**
   * URL blob: du fichier. Une chaîne, et non le Blob lui-même : avec un Blob le viewer
   * convertit en asynchrone et peut manquer l'ouverture du PDF. Pas de base64 non plus.
   */
  pdfSrc: string | null = null;
  erreur = false;

  constructor(
    private readonly http: HttpClient,
    private readonly destroyRef: DestroyRef,
    private readonly dialogRef: MatDialogRef<PdfViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: FileViewerData,
  ) {
  }

  ngOnInit(): void {
    const url = environment.apiURL + 'api/fech-file?fileType=pdf&fileName=' + this.data.encodedPath;
    this.http.get(url, {responseType: 'blob', withCredentials: true})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => this.pdfSrc = URL.createObjectURL(blob),
        error: () => this.erreur = true,
      });
    this.destroyRef.onDestroy(() => {
      if (this.pdfSrc) {
        URL.revokeObjectURL(this.pdfSrc);
      }
    });
  }

  fermer(): void {
    this.dialogRef.close();
  }
}
