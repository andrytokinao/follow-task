import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Subscription} from "rxjs";
import {Issue} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {AvatarComponent} from "../avatar/avatar.component";
import {TypeTacheComponent} from "../type-tache/type-tache.component";
import {StatutTacheComponent} from "../statut-tache/statut-tache.component";
import {IssueApercu, IssueApercuData} from "./issue-apercu.model";
import {IssueApercuService} from "./issue-apercu.service";

/** Assignés montrés en avatars avant le « +n ». */
const AVATARS_VISIBLES = 3;

/**
 * Popup d'aperçu d'un projet (issue master) ou d'une sous-tâche : statut,
 * personnes, dates, avancement, description et liste des sous-tâches.
 *
 * Un clic sur une sous-tâche l'affiche dans la même popup ; « Retour » revient
 * à l'issue précédente. « Ouvrir » mène à la page complète de l'issue affichée.
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

  private issueId: number;
  private souscription?: Subscription;

  constructor(private readonly dialogRef: MatDialogRef<IssueApercuDialogComponent>,
              @Inject(MAT_DIALOG_DATA) readonly data: IssueApercuData,
              private readonly apercuService: IssueApercuService,
              private readonly issueService: IssueService) {
    this.issueId = data.issueId;
  }

  ngOnInit(): void {
    this.charger();
  }

  ngOnDestroy(): void {
    this.souscription?.unsubscribe();
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

  private charger(): void {
    this.souscription?.unsubscribe();
    this.chargement = true;
    this.erreur = false;
    this.souscription = this.apercuService.charger(this.issueId).subscribe({
      next: apercu => {
        this.apercu = apercu;
        this.lienPage = this.issueService.getIssueUrl(apercu.issue);
        this.chargement = false;
      },
      error: () => {
        this.erreur = true;
        this.chargement = false;
      }
    });
  }
}
