import {Component, DestroyRef, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {renderAsync} from 'docx-preview';
import {FileViewerData} from '../file-viewer/file-viewer-data';

/**
 * Visionneuse DOCX en popup, rendue dans le navigateur par docx-preview.
 *
 * Composant standalone chargé à la demande par le {@link FileViewerService} :
 * docx-preview n'entre ainsi dans aucun module partagé.
 */
@Component({
  standalone: true,
  selector: 'app-docx-viewer-dialog',
  imports: [CommonModule, MatDialogModule],
  templateUrl: './docx-viewer-dialog.component.html',
  styleUrls: ['./docx-viewer-dialog.component.css'],
})
export class DocxViewerDialogComponent implements OnInit {

  /** Toujours présent dans le DOM : docx-preview y écrit le document. */
  @ViewChild('conteneur', {static: true}) conteneur: ElementRef<HTMLElement>;

  chargement = true;
  erreur = false;

  constructor(
    private readonly http: HttpClient,
    private readonly destroyRef: DestroyRef,
    private readonly dialogRef: MatDialogRef<DocxViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: FileViewerData,
  ) {
  }

  ngOnInit(): void {
    // api/download plutôt que api/fech-file : ce dernier ne connaît que le type PDF.
    this.http.get(this.data.downloadUrl, {responseType: 'blob', withCredentials: true})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => renderAsync(blob, this.conteneur.nativeElement, undefined, {
          className: 'docx',
          inWrapper: true,
          breakPages: true,
        })
          .then(() => this.chargement = false)
          .catch(() => this.echec()),
        error: () => this.echec(),
      });
  }

  fermer(): void {
    this.dialogRef.close();
  }

  private echec(): void {
    this.chargement = false;
    this.erreur = true;
  }
}
