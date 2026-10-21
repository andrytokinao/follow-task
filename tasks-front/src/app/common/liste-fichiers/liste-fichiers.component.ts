import {Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpEventType} from '@angular/common/http';
import {catchError, concatMap, from, of, Subscription, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {IssueService} from '../../services/issue.service';
import {Issue} from '../../type/issue';
import {AvatarComponent} from '../avatar/avatar.component';
import {FileViewerService} from '../file-viewer/file-viewer.service';
import {TypeTacheComponent} from '../type-tache/type-tache.component';
import {FichierIssue, filtrer, iconeFichier, TacheFichier, tacheDuFichier} from './fichiers-issue';
import {FichiersCharges, FichiersIssueService} from './fichiers-issue.service';

/** Une ligne de la liste : le fichier, sa sous-tâche s'il en a une, et son dossier dans celle-ci. */
interface LigneFichier {
  fichier: FichierIssue;
  tache: TacheFichier | null;
  dossier: string;
}

/** Fichier choisi, en cours d'envoi à la racine de l'issue. */
interface Envoi {
  file: File;
  progression: number;
  statut: 'attente' | 'envoi' | 'ok' | 'erreur';
}

/**
 * Fichiers d'une issue, à plat : tous ceux de son arborescence, sans passer
 * par les dossiers, le plus récent d'abord. Recherche, aperçu (PDF, DOCX),
 * téléchargement, envoi (bouton ou glisser-déposer, à la racine de l'issue) et
 * « Rafraîchir ». Gardés en mémoire par issue (`FichiersIssueService`) : revenir
 * sur l'issue les montre aussitôt. Réutilisable partout où une issue a des fichiers ;
 * avec `taches`, chaque fichier dit à quelle sous-tâche il appartient.
 */
@Component({
  standalone: true,
  selector: 'app-liste-fichiers',
  imports: [CommonModule, FormsModule, AvatarComponent, TypeTacheComponent],
  templateUrl: './liste-fichiers.component.html',
  styleUrls: ['./liste-fichiers.component.css']
})
export class ListeFichiersComponent implements OnChanges, OnDestroy {

  @Input() issueId?: number;
  @Input() titre = 'Fichiers';
  /** Sans marge ni hauteur minimale : dans une popup ou un onglet. */
  @Input() compact = false;
  /**
   * Sous-tâches de l'issue : leurs fichiers, rangés sous leur clé, portent leur
   * nom. Vide (une sous-tâche, la popup) : pas de colonne Tâche.
   */
  @Input() taches: Issue[] = [];

  /** Clic sur la sous-tâche d'un fichier : à l'hôte de l'ouvrir (aperçu, page). */
  @Output() tacheChoisie = new EventEmitter<Issue>();

  charges: FichiersCharges | null = null;
  /** Fichiers affichés : tous, ou ceux de la recherche. */
  visibles: LigneFichier[] = [];
  private tachesParCle = new Map<string, TacheFichier>();
  recherche = '';
  chargement = false;
  erreur: string | null = null;
  envois: Envoi[] = [];
  surZone = false;

  private lecture?: Subscription;

  constructor(private readonly fichiersService: FichiersIssueService,
              private readonly issueService: IssueService,
              private readonly fileViewer: FileViewerService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['taches']) {
      this.tachesParCle = new Map((this.taches ?? [])
        .filter(t => t.issueKey)
        .map(t => [String(t.issueKey), {issue: t, cle: String(t.issueKey), titre: String(t.summary ?? '')}]));
      if (!changes['issueId']) {
        this.chercher();
      }
    }
    if (changes['issueId']) {
      this.recherche = '';
      this.envois = [];
      this.charger(false);
    }
  }

  ngOnDestroy(): void {
    this.lecture?.unsubscribe();
  }

  /** Redemande les fichiers au serveur : ceux d'un autre poste, d'un dépôt direct dans le dossier. */
  rafraichir(): void {
    this.charger(true);
  }

  chercher(): void {
    this.visibles = filtrer(this.charges?.fichiers ?? [], this.recherche, this.tachesParCle).map(fichier => {
      const tache = tacheDuFichier(fichier, this.tachesParCle);
      // Rangé dans le dossier de sa sous-tâche : on montre la tâche, et le dossier dans celle-ci.
      return {fichier, tache, dossier: tache ? fichier.dossiers.slice(1).join(' › ') : fichier.dossier};
    });
  }

  choisirTache(tache: TacheFichier): void {
    this.tacheChoisie.emit(tache.issue);
  }

  icone(fichier: FichierIssue): string {
    return iconeFichier(fichier.extension);
  }

  aApercu(fichier: FichierIssue): boolean {
    return this.fileViewer.canPreview(fichier.nom);
  }

  /** PDF, DOCX : aperçu en popup ; sinon, téléchargement. */
  ouvrir(fichier: FichierIssue): void {
    if (!this.aApercu(fichier)) {
      window.open(this.lienTelechargement(fichier), '_blank');
      return;
    }
    this.fileViewer.open({
      fileName: fichier.nom,
      encodedPath: fichier.fichier.absolutePath!,
      downloadUrl: this.lienTelechargement(fichier),
    });
  }

  precharger(fichier: FichierIssue): void {
    this.fileViewer.preload(fichier.nom);
  }

  lienTelechargement(fichier: FichierIssue): string {
    return environment.apiURL + 'api/download?fileNames=' + fichier.fichier.absolutePath
      + '&directory=source&fileName=' + encodeURIComponent(fichier.nom);
  }

  photo(fichier: FichierIssue): string | null {
    return fichier.fichier.uploadeurPhoto ? environment.apiURL + 'photo/' + fichier.fichier.uploadeurPhoto : null;
  }

  parChemin(_: number, ligne: LigneFichier): unknown {
    return ligne.fichier.fichier.absolutePath;
  }

  // ------------------------------------------------------------------ envoi

  choisir(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.envoyer(input.files);
    input.value = '';
  }

  survoler(event: DragEvent, dedans: boolean): void {
    event.preventDefault();
    this.surZone = dedans;
  }

  deposer(event: DragEvent): void {
    event.preventDefault();
    this.surZone = false;
    this.envoyer(event.dataTransfer?.files ?? null);
  }

  /** Envoie les fichiers un par un à la racine de l'issue, puis redemande la liste. */
  private envoyer(fichiers: FileList | null): void {
    const racine = this.charges?.racine.absolutePath;
    if (!fichiers?.length || !racine || this.issueId == null) {
      return;
    }
    const issueId = this.issueId;
    const lot: Envoi[] = Array.from(fichiers).map(file => ({file, progression: 0, statut: 'attente'}));
    this.envois = [...this.envois.filter(e => e.statut !== 'ok'), ...lot];
    from(lot).pipe(
      concatMap(envoi => {
        envoi.statut = 'envoi';
        return this.issueService.uploadDansDossier(envoi.file, racine, envoi.file.name).pipe(
          tap(evenement => {
            if (evenement.type === HttpEventType.UploadProgress) {
              envoi.progression = Math.round((evenement.loaded / (evenement.total || 1)) * 100);
            } else if (evenement.type === HttpEventType.Response) {
              envoi.statut = 'ok';
              envoi.progression = 100;
            }
          }),
          catchError(() => {
            envoi.statut = 'erreur';
            return of(null);
          }));
      })
    ).subscribe({
      complete: () => {
        if (issueId === this.issueId) {
          this.envois = this.envois.filter(e => e.statut === 'erreur');
          this.charger(true);
        } else {
          this.fichiersService.oublier(issueId);
        }
      }
    });
  }

  // ------------------------------------------------------------------ lecture

  private charger(forcer: boolean): void {
    this.lecture?.unsubscribe();
    this.erreur = null;
    if (this.issueId == null) {
      this.charges = null;
      this.visibles = [];
      return;
    }
    // En mémoire : affichés tout de suite, même pendant un rafraîchissement.
    const connus = this.fichiersService.enCache(this.issueId);
    if (connus) {
      this.afficher(connus);
    } else {
      this.charges = null;
      this.visibles = [];
    }
    this.chargement = forcer || !connus;
    this.lecture = this.fichiersService.charger(this.issueId, forcer).subscribe({
      next: charges => {
        this.chargement = false;
        this.afficher(charges);
      },
      error: err => {
        this.chargement = false;
        this.erreur = 'Chargement des fichiers impossible : ' + (typeof err === 'string' ? err : err?.message ?? '');
      }
    });
  }

  private afficher(charges: FichiersCharges): void {
    this.charges = charges;
    this.chercher();
  }
}
