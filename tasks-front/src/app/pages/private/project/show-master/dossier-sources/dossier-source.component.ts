import {Component, NgZone, OnInit} from '@angular/core';
import {Issue, Repertoire} from "../../../../../type/issue";
import {IssueService} from "../../../../../services/issue.service";
import {HttpEventType} from "@angular/common/http";
import {catchError, concatMap, from, of, tap} from "rxjs";
import {environment} from "../../../../../../environments/environment";

/** Fichier en attente d'envoi, avec le chemin relatif a recreer coté serveur. */
interface FichierEnAttente {
  file: File;
  relativePath: string;
  status: '' | 'pending' | 'uploading' | 'success' | 'error';
  progression: number;
}

@Component({
  standalone: false,
  selector: 'app-dossier-source',
  templateUrl: './dossier-source.component.html',
  styleUrl: './dossier-source.component.css'
})
export class DossierSourceComponent implements OnInit {
  protected parentIssue: Issue;
  protected racine: Repertoire;
  protected courant: Repertoire;
  /** Fil d'Ariane : de la racine jusqu'au dossier courant. */
  protected chemin: Repertoire[] = [];
  protected enAttente: FichierEnAttente[] = [];
  protected chargement = false;
  protected erreur: string;
  protected surZone = false;
  protected creationDossier = false;
  protected nomNouveauDossier = '';

  constructor(protected issueService: IssueService,
              private zone: NgZone
  ) {
  }

  ngOnInit(): void {
    this.issueService.issueMaster$.subscribe(issue => {
      this.parentIssue = issue;
      if (this.parentIssue && this.parentIssue.id) {
        this.chargerArborescence();
      }
    })
  }

  // ---------------------------------------------------------------- navigation

  private chargerArborescence(cheminAttendu: string[] = []) {
    this.chargement = true;
    this.erreur = undefined;
    this.issueService.loadDirectory(this.parentIssue.id).subscribe({
      next: racine => {
        this.racine = racine;
        this.chemin = [racine];
        this.courant = racine;
        for (const path of cheminAttendu.slice(1)) {
          const suivant = this.sousDossiers(this.courant).find(r => r.absolutePath === path);
          if (!suivant) {
            break;
          }
          this.chemin.push(suivant);
          this.courant = suivant;
        }
        this.chargement = false;
      },
      error: err => {
        // handleError() du service renvoie deja un message texte : on l'affiche
        // tel quel, sinon l'ecran reste vide sans expliquer pourquoi.
        this.erreur = "Chargement des dossiers de l'issue #" + this.parentIssue?.id
          + " impossible : " + (typeof err === 'string' ? err : (err?.message || JSON.stringify(err)));
        console.error("chargerArborescence", err);
        this.chargement = false;
      }
    });
  }

  /** Recharge depuis le serveur en restant sur le dossier courant. */
  protected rafraichir() {
    this.chargerArborescence(this.chemin.map(r => r.absolutePath));
  }

  protected sousDossiers(repertoire: Repertoire): Repertoire[] {
    return (repertoire?.repertoires || []).filter(r => r.type === 'directory');
  }

  protected fichiers(repertoire: Repertoire): Repertoire[] {
    return (repertoire?.repertoires || []).filter(r => r.type !== 'directory');
  }

  protected ouvrir(dossier: Repertoire) {
    const chemin = this.construireChemin(this.racine, dossier.absolutePath);
    if (chemin) {
      this.chemin = chemin;
      this.courant = chemin[chemin.length - 1];
    }
  }

  protected allerA(index: number) {
    this.chemin = this.chemin.slice(0, index + 1);
    this.courant = this.chemin[this.chemin.length - 1];
  }

  protected estOuvert(dossier: Repertoire): boolean {
    return this.chemin.some(r => r.absolutePath === dossier.absolutePath);
  }

  private construireChemin(noeud: Repertoire, absolutePath: string): Repertoire[] | null {
    if (!noeud) {
      return null;
    }
    if (noeud.absolutePath === absolutePath) {
      return [noeud];
    }
    for (const enfant of this.sousDossiers(noeud)) {
      const sous = this.construireChemin(enfant, absolutePath);
      if (sous) {
        return [noeud, ...sous];
      }
    }
    return null;
  }

  // ------------------------------------------------------------ nouveau dossier

  protected creerDossier() {
    const nom = this.nomNouveauDossier.trim();
    if (!nom || !this.courant) {
      return;
    }
    this.issueService.createDossier(this.courant.absolutePath, nom).subscribe({
      next: () => {
        this.nomNouveauDossier = '';
        this.creationDossier = false;
        this.rafraichir();
      },
      error: err => {
        this.erreur = "Creation du dossier impossible : " + (err?.error || err?.message);
        console.error("creerDossier", err);
      }
    });
  }

  // --------------------------------------------------------------------- upload

  protected onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.ajouterFileList(input.files);
    }
    input.value = '';
  }

  private ajouterFileList(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i)!;
      // webkitRelativePath est renseigne quand l'input porte l'attribut webkitdirectory
      const relatif = (file as any).webkitRelativePath;
      this.ajouter(file, relatif && relatif.length > 0 ? relatif : file.name);
    }
  }

  private ajouter(file: File, relativePath: string) {
    this.enAttente.push({file, relativePath, status: 'pending', progression: 0});
  }

  protected retirer(index: number) {
    this.enAttente.splice(index, 1);
  }

  protected onDragOver(event: DragEvent) {
    event.preventDefault();
    this.surZone = true;
  }

  protected onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.surZone = false;
  }

  protected onDrop(event: DragEvent) {
    event.preventDefault();
    this.surZone = false;
    const items = event.dataTransfer?.items;
    if (items && items.length > 0 && typeof (items[0] as any).webkitGetAsEntry === 'function') {
      const entries: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = (items[i] as any).webkitGetAsEntry();
        if (entry) {
          entries.push(entry);
        }
      }
      if (entries.length > 0) {
        entries.forEach(entry => this.parcourirEntry(entry, ''));
        return;
      }
    }
    if (event.dataTransfer?.files) {
      this.ajouterFileList(event.dataTransfer.files);
    }
  }

  /**
   * Parcourt recursivement une entree deposee : les callbacks de l'API
   * FileSystemEntry sortent de la zone Angular, d'ou le zone.run.
   */
  private parcourirEntry(entry: any, prefixe: string) {
    if (entry.isFile) {
      entry.file((file: File) => {
        this.zone.run(() => this.ajouter(file, prefixe + file.name));
      });
      return;
    }
    if (entry.isDirectory) {
      const reader = entry.createReader();
      // readEntries ne renvoie que 100 entrees par appel : on relit jusqu'au lot vide.
      const lire = () => reader.readEntries((resultats: any[]) => {
        if (!resultats || resultats.length === 0) {
          return;
        }
        this.zone.run(() => resultats.forEach(r => this.parcourirEntry(r, prefixe + entry.name + '/')));
        lire();
      });
      lire();
    }
  }

  protected get aEnvoyer(): boolean {
    return this.enAttente.some(f => f.status !== 'success' && f.status !== 'uploading');
  }

  protected envoyer() {
    if (!this.courant) {
      return;
    }
    const cible = this.courant.absolutePath;
    const files = this.enAttente.filter(f => f.status !== 'success');
    if (files.length === 0) {
      return;
    }
    from(files).pipe(
      concatMap(item => {
        item.status = 'uploading';
        return this.issueService.uploadDansDossier(item.file, cible, item.relativePath).pipe(
          tap(event => {
            if (event.type === HttpEventType.UploadProgress) {
              item.progression = Math.round((event.loaded / (event.total || 1)) * 100);
            } else if (event.type === HttpEventType.Response) {
              item.status = 'success';
              item.progression = 100;
            }
          }),
          catchError(err => {
            console.error("upload " + item.file.name, err);
            item.status = 'error';
            return of(null);
          })
        );
      })
    ).subscribe({
      complete: () => {
        this.enAttente = this.enAttente.filter(f => f.status === 'error');
        this.rafraichir();
      }
    });
  }

  // ----------------------------------------------------------------- affichage

  protected downloadUrl(fichier: Repertoire): string {
    return environment.apiURL + 'api/download?fileNames=' + fichier.absolutePath
      + '&directory=source&fileName=' + encodeURIComponent(fichier.fileName.toString());
  }

  protected getFileIconClass(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'fas fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fas fa-file-excel';
      case 'zip':
      case 'rar':
      case '7z':
        return 'fas fa-file-archive';
      case 'mp3':
      case 'wav':
        return 'fas fa-file-audio';
      case 'mp4':
      case 'avi':
      case 'mkv':
        return 'fas fa-file-video';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'fas fa-file-image';
      default:
        return 'fas fa-file';
    }
  }
}
