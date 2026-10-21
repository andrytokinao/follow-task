import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
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
import {SectionDifferee} from "./section-differee";

/** Assignés montrés en avatars avant le « +n ». */
const AVATARS_VISIBLES = 3;

/**
 * Popup d'aperçu d'un projet (issue master) ou d'une sous-tâche : statut,
 * personnes, dates, avancement, description et liste des sous-tâches.
 *
 * Un clic sur une sous-tâche l'affiche dans la même popup ; « Retour » revient
 * à l'issue précédente. « Ouvrir » mène à la page complète de l'issue affichée.
 *
 * L'issue s'affiche sans attendre ses sous-tâches, ni ses pièces jointes et
 * commentaires, demandés juste après elle (`SectionDifferee`).
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

  /**
   * Fichiers de l'issue, à plat (app-liste-fichiers) : envoi, aperçu,
   * rafraîchir ; gardés en mémoire par issue. Prête quand la liste est reçue.
   */
  readonly piecesJointes = new SectionDifferee(
    () => import('../liste-fichiers/liste-fichiers.component').then(m => m.ListeFichiersComponent),
    issue => ({titre: 'Pièces jointes', compact: true, issueId: issue.id}),
    liste => !!liste.charges || !!liste.erreur);

  /**
   * Commentaires de l'issue, et en ajouter (texte, fichiers joints). Le
   * composant est déclaré dans le module du projet, chargé à la demande : on
   * l'importe avec lui.
   */
  readonly commentaires = new SectionDifferee(
    () => Promise.all([
      import('../../pages/private/project/show-master/issue-master.module'),
      import('../../pages/private/project/show-master/comments/comments.component')
    ]).then(([, m]) => m.CommentsComponent),
    issue => ({issue}));

  @ViewChild('hotePiecesJointes', {read: ViewContainerRef}) private hotePiecesJointes?: ViewContainerRef;
  @ViewChild('hoteCommentaires', {read: ViewContainerRef}) private hoteCommentaires?: ViewContainerRef;

  private issueId: number;
  private souscription?: Subscription;
  private detruite = false;

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
    this.detruite = true;
    this.souscription?.unsubscribe();
    this.piecesJointes.oublier();
    this.commentaires.oublier();
  }

  /**
   * Pièces jointes et commentaires de l'issue affichée, demandés juste après
   * elle : l'aperçu ne les attend pas.
   */
  private chargerSections(issue: Issue): void {
    // Popup fermée pendant un import : plus de vue à rafraîchir.
    const rafraichir = () => !this.detruite && this.cdr.detectChanges();
    this.piecesJointes.monter(issue, () => this.hotePiecesJointes, rafraichir);
    this.commentaires.monter(issue, () => this.hoteCommentaires, rafraichir);
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
    // Une autre issue : les sections de la précédente s'en vont, les siennes viendront après elle.
    if (!this.piecesJointes.estPour(this.issueId)) {
      this.piecesJointes.oublier();
      this.commentaires.oublier();
    }
    this.souscription = this.apercuService.charger(this.issueId).subscribe({
      next: apercu => {
        this.apercu = apercu;
        this.lienPage = this.issueService.getIssueUrl(apercu.issue);
        this.chargement = false;
        // Après le rendu de l'issue : les emplacements existent, et l'issue s'affiche sans attendre ses sections.
        setTimeout(() => this.chargerSections(apercu.issue));
      },
      error: () => {
        this.erreur = true;
        this.chargement = false;
      }
    });
  }
}
