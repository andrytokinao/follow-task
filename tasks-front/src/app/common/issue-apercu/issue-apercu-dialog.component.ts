import {ChangeDetectorRef, Component, ComponentRef, Inject, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Subscription} from "rxjs";
import {Issue} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {AvatarComponent} from "../avatar/avatar.component";
import {TypeTacheComponent} from "../type-tache/type-tache.component";
import {StatutTacheComponent} from "../statut-tache/statut-tache.component";
import {IssueApercu, IssueApercuData, SousTacheApercu} from "./issue-apercu.model";
import {IssueApercuService} from "./issue-apercu.service";

/** Assignés montrés en avatars avant le « +n ». */
const AVATARS_VISIBLES = 3;

/**
 * Popup d'aperçu d'un projet (issue master) ou d'une sous-tâche : statut,
 * personnes, dates, avancement, description et liste des sous-tâches.
 *
 * Un clic sur une sous-tâche l'affiche dans la même popup ; « Retour » revient
 * à l'issue précédente. « Ouvrir » mène à la page complète de l'issue affichée.
 *
 * L'issue s'affiche sans attendre ses sous-tâches. Les pièces jointes ne sont
 * chargées qu'à la demande : l'explorateur de fichiers (envoi, rafraîchir) est
 * créé au clic, importé à la volée — `MyCommonModule`, qui le déclare, mène
 * lui-même à cette popup.
 */
@Component({
  standalone: true,
  selector: 'app-issue-apercu-dialog',
  imports: [CommonModule, MatDialogModule, AvatarComponent, TypeTacheComponent, StatutTacheComponent],
  templateUrl: './issue-apercu-dialog.component.html',
  styleUrls: ['./issue-apercu-dialog.component.scss'],
})
export class IssueApercuDialogComponent implements OnInit, OnDestroy {

  readonly avatarsVisibles = AVATARS_VISIBLES;

  apercu: IssueApercu | null = null;
  chargement = true;
  erreur = false;

  /** Issues affichées avant la courante, pour « Retour ». */
  historique: number[] = [];

  /** Lien vers la page de l'issue courante ; null hors du projet ouvert. */
  lienPage: string | null = null;

  /** Explorateur des pièces jointes en cours d'import (le code, pas encore les fichiers). */
  private importPiecesJointes = false;

  @ViewChild('hotePiecesJointes', {read: ViewContainerRef}) private hotePiecesJointes?: ViewContainerRef;

  private issueId: number;
  private souscription?: Subscription;
  private explorateur?: ComponentRef<any>;

  constructor(private readonly dialogRef: MatDialogRef<IssueApercuDialogComponent>,
              @Inject(MAT_DIALOG_DATA) readonly data: IssueApercuData,
              private readonly apercuService: IssueApercuService,
              private readonly issueService: IssueService,
              private readonly cdr: ChangeDetectorRef) {
    this.issueId = data.issueId;
  }

  ngOnInit(): void {
    this.charger();
  }

  ngOnDestroy(): void {
    this.souscription?.unsubscribe();
    this.explorateur?.destroy();
  }

  /** Pièces jointes pas encore là : code de l'explorateur à importer, ou arborescence à recevoir. */
  get piecesJointesEnCours(): boolean {
    const explorateur = this.explorateur?.instance;
    return this.importPiecesJointes || (!!explorateur && !explorateur.racine && !explorateur.erreur);
  }

  /**
   * Pièces jointes de l'issue affichée, demandées juste après elle : l'aperçu
   * ne les attend pas. L'explorateur suit ensuite l'issue (rafraîchir, envoyer).
   */
  private async chargerPiecesJointes(): Promise<void> {
    this.importPiecesJointes = true;
    const {ExplorateurFichiersComponent} = await import('../explorateur-fichiers/explorateur-fichiers.component');
    this.importPiecesJointes = false;
    // Déjà un explorateur, ou plus de popup : rien à faire. Une autre issue entre-temps : c'est la sienne.
    if (this.explorateur || !this.hotePiecesJointes) {
      this.cdr.markForCheck();
      return;
    }
    this.explorateur = this.hotePiecesJointes.createComponent(ExplorateurFichiersComponent);
    this.explorateur.setInput('titre', 'Pièces jointes');
    this.explorateur.setInput('sousTitre', 'Glissez-déposez un fichier, ou envoyez-le avec le bouton.');
    this.explorateur.setInput('compact', true);
    this.explorateur.setInput('issueId', this.issueId);
    this.cdr.detectChanges();
  }

  private oublierPiecesJointes(): void {
    this.explorateur?.destroy();
    this.explorateur = undefined;
  }

  afficher(issue: Issue): void {
    if (!issue?.id || issue.id === this.issueId) {
      return;
    }
    this.historique.push(this.issueId);
    this.issueId = issue.id;
    this.charger();
  }

  retour(): void {
    const precedent = this.historique.pop();
    if (precedent != null) {
      this.issueId = precedent;
      this.charger();
    }
  }

  recharger(): void {
    this.charger();
  }

  ouvrirPage(): void {
    if (this.apercu) {
      this.issueService.openIssue(this.apercu.issue);
      this.fermer();
    }
  }

  fermer(): void {
    this.dialogRef.close();
  }

  parSousTache(_: number, sousTache: SousTacheApercu): unknown {
    return sousTache.issue.id;
  }

  private charger(): void {
    this.souscription?.unsubscribe();
    this.chargement = true;
    this.erreur = false;
    // Une autre issue : l'explorateur de la précédente s'en va, le sien viendra après elle.
    if (this.explorateur && this.explorateur.instance.issueId !== this.issueId) {
      this.oublierPiecesJointes();
    }
    this.souscription = this.apercuService.charger(this.issueId).subscribe({
      next: apercu => {
        this.apercu = apercu;
        this.lienPage = this.issueService.getIssueUrl(apercu.issue);
        this.chargement = false;
        // Après le rendu de l'issue : la section des pièces jointes existe, et l'issue s'affiche sans les attendre.
        if (!this.explorateur && !this.importPiecesJointes) {
          setTimeout(() => this.chargerPiecesJointes());
        }
      },
      error: () => {
        this.erreur = true;
        this.chargement = false;
      }
    });
  }
}
