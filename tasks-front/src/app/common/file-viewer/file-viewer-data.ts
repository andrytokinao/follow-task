/** Le fichier à afficher en aperçu, quelle que soit sa provenance (document, pièce jointe…). */
export interface FileViewerData {
  fileName: string;
  /** Chemin encodé, tel qu'attendu par api/fech-file. */
  encodedPath: string;
  downloadUrl: string;
}
