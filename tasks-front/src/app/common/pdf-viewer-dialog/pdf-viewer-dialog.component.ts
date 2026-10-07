import {Component, DestroyRef, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {NgxExtendedPdfViewerModule} from 'ngx-extended-pdf-viewer';
import {Uploaded} from '../../type/issue';
import {environment} from '../../../environments/environment';
import {IssueService} from '../../services/issue.service';

export interface PdfViewerDialogData {
  uploaded: Uploaded;
}

/**
 * Visionneuse PDF en popup.
 *
 * Composant standalone pour être chargé à la demande par le {@link PdfViewerService} :
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

  /** Le fichier est passé tel quel au viewer, sans conversion base64. */
  pdfSrc: Blob | null = null;
  erreur = false;

  constructor(
    private readonly http: HttpClient,
    private readonly destroyRef: DestroyRef,
    private readonly dialogRef: MatDialogRef<PdfViewerDialogComponent>,
    protected readonly issueService: IssueService,
    @Inject(MAT_DIALOG_DATA) readonly data: PdfViewerDialogData,
  ) {
  }

  ngOnInit(): void {
    const url = environment.apiURL + 'api/fech-file?fileType=pdf&fileName=' + this.data.uploaded.encodedPath;
    this.http.get(url, {responseType: 'blob', withCredentials: true})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => this.pdfSrc = blob,
        error: () => this.erreur = true,
      });
  }

  fermer(): void {
    this.dialogRef.close();
  }
}
