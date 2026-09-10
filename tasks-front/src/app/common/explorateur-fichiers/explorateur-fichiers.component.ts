import {Component, Input, NgZone, OnChanges, SimpleChanges} from '@angular/core';
import {Repertoire} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {ConfirmationDialogService} from "../../services/confirmation-dialog.service";
import {HttpEventType} from "@angular/common/http";
import {catchError, concatMap, forkJoin, from, of, tap} from "rxjs";
import {environment} from "../../../environments/environment";

/**
 * Fichier en attente d'envoi. La destination est figee au moment du depot :
 * deposer sur un dossier de l'arbre n'oblige pas a s'y deplacer d'abord, et
 * deux depots successifs peuvent viser deux dossiers differents.
 */
interface FichierEnAttente {
  file: File;
  relativePath: string;
  /** Chemin encode du dossier cible. */
  destination: string;
  /** Nom du dossier cible, pour l'affichage de la file d'attente. */
  destinationNom: string;
  status: '' | 'pending' | 'uploading' | 'success' | 'error';
  progression: number;
}

/**
 * Explorateur de l'arborescence d'une issue : navigation, creation de dossier,
 * upload par glisser-deposer et suppression multiple. Reutilisable partout ou
 * une issue (master ou sous-tache) expose ses fichiers.
 */
@Component({
  standalone: false,
  selector: 'app-explorateur-fichiers',
  templateUrl: './explorateur-fichiers.component.html',
  styleUrl: './explorateur-fichiers.component.css'
})
export class ExplorateurFichiersComponent implements OnChanges {
  /** Issue dont on explore le repertoire (master ou sous-tache). */
  @Input() issueId: number;
  @Input() titre = 'Dossiers sources';
  @Input() sousTitre = 'Glissez-deposez un fichier ou un dossier sur le dossier voulu.';
  /** Version reduite : sans marge ni hauteur minimale, pour un onglet. */
  @Input() compact = false;

  protected racine: Repertoire;
  protected courant: Repertoire;
  /** Fil d'Ariane : de la racine jusqu'au dossier courant. */
  protected chemin: Repertoire[] = [];
  /** Chemins absolus coches dans le dossier courant. */
  protected selection = new Set<string>();
  protected enAttente: FichierEnAttente[] = [];
  protected chargement = false;
  protected erreur: string;
  protected surZone = false;
  /** Chemin encode du dossier actuellement survole pendant un glisser. */
  protected survolCible: string = null;
  protected creationDossier = false;
  protected nomNouveauDossier = '';

  constructor(protected issueService: IssueService,
              private confirmation: ConfirmationDialogService,
              private zone: NgZone
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['issueId']) {
      this.racine = undefined;
      this.courant = undefined;
      this.chemin = [];
      this.enAttente = [];
      this.selection.clear();
      if (this.issueId) {
        this.chargerArborescence();
      }
    }
  }

  // ---------------------------------------------------------------- navigation

  private chargerArborescence(cheminAttendu: string[] = []) {
    this.chargement = true;
    this.erreur = undefined;
    this.issueService.loadDirectory(this.issueId).subscribe({
      next: racine => {
        this.racine = racine;
        let chemin = [racine];
        for (const path of cheminAttendu.slice(1)) {
          const suivant = this.sousDossiers(chemin[chemin.length - 1]).find(r => r.absolutePath === path);
          if (!suivant) {
            break;
          }
          chemin.push(suivant);
        }
        this.positionner(chemin);
        this.chargement = false;
      },
      error: err => {
        // handleError() du service renvoie deja un message texte : on l'affiche
        // tel quel, sinon l'ecran reste vide sans expliquer pourquoi.
        this.erreur = "Chargement des dossiers de l'issue #" + this.issueId
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
      this.positionner(chemin);
    }
  }

  protected allerA(index: number) {
    this.positionner(this.chemin.slice(0, index + 1));
  }

  /** Change de dossier courant : la selection ne survit pas au changement. */
  private positionner(chemin: Repertoire[]) {
    this.chemin = chemin;
    this.courant = chemin[chemin.length - 1];
    this.selection.clear();
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

  // ---------------------------------------------------------------- selection

  /** Dossiers puis fichiers du dossier courant, dans l'ordre d'affichage. */
  protected get elementsCourants(): Repertoire[] {
    return [...this.sousDossiers(this.courant), ...this.fichiers(this.courant)];
  }

  protected estSelectionne(item: Repertoire): boolean {
    return this.selection.has(item.absolutePath);
  }

  protected basculerSelection(item: Repertoire, event: Event) {
    // stopPropagation : cocher une ligne de dossier ne doit pas l'ouvrir.
    event.stopPropagation();
    if (!this.selection.delete(item.absolutePath)) {
      this.selection.add(item.absolutePath);
    }
  }

  protected get toutSelectionne(): boolean {
    const items = this.elementsCourants;
    return items.length > 0 && items.every(i => this.selection.has(i.absolutePath));
  }

  protected basculerTout() {
    const items = this.elementsCourants;
    const tout = this.toutSelectionne;
    this.selection.clear();
    if (!tout) {
      items.forEach(i => this.selection.add(i.absolutePath));
    }
  }

  // -------------------------------------------------------------- suppression

  protected supprimerSelection() {
    this.supprimer(this.elementsCourants.filter(i => this.estSelectionne(i)));
  }

  /** Supprime fichiers et dossiers apres confirmation, puis recharge. */
  protected supprimer(cibles: Repertoire[]) {
    if (cibles.length === 0) {
      return;
    }
    const dossiers = cibles.filter(c => c.type === 'directory').length;
    const message = cibles.length === 1
      ? `Supprimer definitivement "${cibles[0].fileName}"`
      + (dossiers > 0 ? ' et tout son contenu ?' : ' ?')
      : `Supprimer definitivement ${cibles.length} elements`
      + (dossiers > 0 ? `, dont ${dossiers} dossier(s) et tout leur contenu ?` : ' ?');
    this.confirmation.confirm('Confirmer la suppression', message, 'Supprimer', 'Annuler')
      .then(confirme => {
        if (!confirme) {
          return;
        }
        // catchError par cible : un echec isole ne doit pas annuler les autres.
        forkJoin(cibles.map(cible => this.issueService.deleteReperoire(cible.absolutePath)
          .pipe(catchError(() => of(null))))
        ).subscribe(() => {
          this.selection.clear();
          this.rafraichir();
        });
      })
      // Fermeture du dialogue sans repondre (echap, clic hors modale).
      .catch(() => {
      });
  }

  // --------------------------------------------------------------------- upload

  protected onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.ajouterFileList(input.files, this.courant);
    }
    input.value = '';
  }

  private ajouterFileList(files: FileList, cible: Repertoire) {
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i)!;
      // webkitRelativePath est renseigne quand l'input porte l'attribut webkitdirectory
      const relatif = (file as any).webkitRelativePath;
      this.ajouter(file, relatif && relatif.length > 0 ? relatif : file.name, cible);
    }
  }

  private ajouter(file: File, relativePath: string, cible: Repertoire) {
    this.enAttente.push({
      file,
      relativePath,
      destination: cible.absolutePath,
      destinationNom: cible.fileName?.toString(),
      status: 'pending',
      progression: 0
    });
  }

  protected retirer(index: number) {
    this.enAttente.splice(index, 1);
  }

  protected onDragOver(event: DragEvent) {
    event.preventDefault();
    this.surZone = true;
  }

  protected onDragLeave(event: DragEvent) {
    // dragleave se declenche aussi en passant sur un enfant de la zone :
    // sans ce test le surlignage clignoterait a chaque ligne survolee.
    const zone = event.currentTarget as HTMLElement;
    const vers = event.relatedTarget as Node;
    if (vers && zone.contains(vers)) {
      return;
    }
    this.surZone = false;
  }

  /** Depot sur un dossier precis de l'arbre ou de la liste. */
  protected onDragOverDossier(event: DragEvent, dossier: Repertoire) {
    event.preventDefault();
    event.stopPropagation();
    this.survolCible = dossier.absolutePath;
  }

  protected onDragLeaveDossier(event: DragEvent, dossier: Repertoire) {
    event.stopPropagation();
    if (this.survolCible === dossier.absolutePath) {
      this.survolCible = null;
    }
  }

  protected onDropDossier(event: DragEvent, dossier: Repertoire) {
    // stopPropagation : sans lui, un depot sur un noeud enfant remonterait
    // aussi jusqu'aux noeuds parents de l'arbre.
    event.stopPropagation();
    this.survolCible = null;
    this.onDrop(event, dossier);
  }

  protected onDrop(event: DragEvent, cible?: Repertoire) {
    event.preventDefault();
    this.surZone = false;
    const destination = cible || this.courant;
    if (!destination) {
      return;
    }
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
        entries.forEach(entry => this.parcourirEntry(entry, '', destination));
        return;
      }
    }
    if (event.dataTransfer?.files) {
      this.ajouterFileList(event.dataTransfer.files, destination);
    }
  }

  /**
   * Parcourt recursivement une entree deposee : les callbacks de l'API
   * FileSystemEntry sortent de la zone Angular, d'ou le zone.run.
   */
  private parcourirEntry(entry: any, prefixe: string, cible: Repertoire) {
    if (entry.isFile) {
      entry.file((file: File) => {
        this.zone.run(() => this.ajouter(file, prefixe + file.name, cible));
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
        this.zone.run(() => resultats.forEach(r => this.parcourirEntry(r, prefixe + entry.name + '/', cible)));
        lire();
      });
      lire();
    }
  }

  protected get aEnvoyer(): boolean {
    return this.enAttente.some(f => f.status !== 'success' && f.status !== 'uploading');
  }

  protected envoyer() {
    const files = this.enAttente.filter(f => f.status !== 'success' && f.destination);
    if (files.length === 0) {
      return;
    }
    from(files).pipe(
      concatMap(item => {
        item.status = 'uploading';
        return this.issueService.uploadDansDossier(item.file, item.destination, item.relativePath).pipe(
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
