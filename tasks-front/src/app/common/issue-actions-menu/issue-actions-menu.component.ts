import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {forkJoin} from "rxjs";
import {ToastrService} from "ngx-toastr";
import {Issue} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {MasterGuard} from "../../services/MasterGuard";
import {NotificationService} from "../../services/notification.service";
import {ConfirmationDialogService} from "../../services/confirmation-dialog.service";

/**
 * Bouton « ••• » et son menu d'actions sur une issue (master ou sous-tâche).
 *
 *   <app-issue-actions-menu [issue]="issue"
 *                           (supprimee)="retourListe()"
 *                           (changerType)="changeIssueType()">
 *   </app-issue-actions-menu>
 *
 * Le menu fait lui-même ce qui ne dépend pas de l'écran : partager (copier le
 * lien ou la clé), tâches liées, suppression après confirmation. L'hôte n'a
 * qu'à réagir à `supprimee`, par exemple en quittant la page.
 *
 * Ce qui dépend de l'écran lui est délégué : « Changer le type » et « Ouvrir
 * le dossier » n'apparaissent que si l'hôte écoute la sortie correspondante.
 * L'écran de détail gère déjà, par exemple, le changement de clé dans l'URL.
 *
 * Les droits (suppression, changement de type) sont vérifiés à l'ouverture
 * du menu, sur l'issue elle-même : un assigné y a les droits que le serveur
 * lui calcule, comme dans MasterGuard.
 */
@Component({
  standalone: false,
  selector: 'app-issue-actions-menu',
  templateUrl: './issue-actions-menu.component.html',
  styleUrl: './issue-actions-menu.component.css'
})
export class IssueActionsMenuComponent {
  @Input() issue: Issue;
  /** Émis une fois la suppression acceptée par le serveur. */
  @Output() supprimee = new EventEmitter<Issue>();
  /** « Changer le type » : l'hôte ouvre le formulaire et gère la nouvelle clé. */
  @Output() changerType = new EventEmitter<Issue>();
  /** « Ouvrir le dossier » : l'hôte affiche les fichiers de l'issue. */
  @Output() ouvrirDossier = new EventEmitter<Issue>();

  protected peutSupprimer = false;
  protected peutChangerType = false;
  protected suppressionEnCours = false;

  constructor(private issueService: IssueService,
              private masterGuard: MasterGuard,
              private notificationService: NotificationService,
              private confirmationDialogService: ConfirmationDialogService,
              private toastr: ToastrService,
              private route: ActivatedRoute) {
  }

  /** Entrées déléguées : affichées seulement si l'hôte s'y est branché. */
  protected get avecChangerType(): boolean {
    return this.changerType.observed && this.peutChangerType;
  }

  protected get avecDossier(): boolean {
    return this.ouvrirDossier.observed;
  }

  /** Appelé par (menuOpened) : les droits ont pu changer depuis la dernière ouverture. */
  protected verifierDroits(): void {
    const prefix = this.projectPrefix();
    const cle = this.issue?.issueKey as string;
    forkJoin([
      this.masterGuard.hasIssueCredential(['CAN_DELETE_TASK'], prefix, cle),
      this.masterGuard.hasIssueCredential(['CAN_EDIT_FIELD', 'CAN_EDIT_TASK'], prefix, cle)
    ]).subscribe(([supprimer, changerType]) => {
      this.peutSupprimer = supprimer;
      this.peutChangerType = changerType;
    });
  }

  // ---------- Partager ----------

  protected copierLien(): void {
    this.copier(this.lien(), 'Lien de la tâche copié');
  }

  protected copierCle(): void {
    this.copier(String(this.issue?.issueKey ?? ''), `Clé ${this.issue?.issueKey} copiée`);
  }

  /**
   * Lien vers l'issue, quel que soit l'écran où se trouve le menu : détail
   * pour une master, onglet des sous-tâches de sa master pour une sous-tâche.
   */
  private lien(): string {
    const prefix = this.projectPrefix();
    const cle = this.issue?.issueKey;
    const parent = this.issue?.parent?.issueKey;
    if (!prefix || !cle) {
      return window.location.href;
    }
    const chemin = parent
      ? `/working/${prefix}/issue/${parent}/subtask/${cle}`
      : `/working/${prefix}/issue/${cle}/details`;
    return window.location.origin + chemin;
  }

  private copier(texte: string, succes: string): void {
    if (!texte || !navigator.clipboard) {
      this.toastr.error('Impossible de copier');
      return;
    }
    navigator.clipboard.writeText(texte).then(
      () => this.toastr.success(succes),
      () => this.toastr.error('Impossible de copier')
    );
  }

  // ---------- Actions déléguées ----------

  protected demanderChangementType(): void {
    this.changerType.emit(this.issue);
  }

  protected demanderDossier(): void {
    this.ouvrirDossier.emit(this.issue);
  }

  // ---------- Supprimer ----------

  /**
   * Même confirmation que les listes : le serveur emporte commentaires,
   * fichiers, planning et historique avec l'issue.
   */
  protected supprimer(): void {
    const issue = this.issue;
    if (!issue?.id || this.suppressionEnCours) {
      return;
    }
    this.confirmationDialogService
      .confirm(
        `Suppression de "${issue.issueKey} · ${issue.summary}"`,
        'Commentaires, pièces jointes, planning, sous-tâches et historique seront perdus. Voulez-vous la supprimer ?',
        'Supprimer',
        'Annuler'
      )
      // « Annuler » ferme la fenêtre avec false, sans la rejeter.
      .then(confirmed => {
        if (!confirmed) return;
        this.suppressionEnCours = true;
        this.issueService.removeIssue(issue.id as number).subscribe({
          next: () => {
            this.suppressionEnCours = false;
            // Ses notifications sont parties avec elle : sans rechargement,
            // leur pastille resterait affichée.
            this.notificationService.reload();
            this.toastr.success(`Tâche ${issue.issueKey} supprimée`);
            this.supprimee.emit(issue);
          },
          error: () => {
            this.suppressionEnCours = false;
            this.toastr.error(`Impossible de supprimer la tâche ${issue.issueKey}`);
          }
        });
      })
      .catch(() => undefined);
  }

  /** Préfixe de l'issue, à défaut celui de la route (même repli que app-assign-field). */
  private projectPrefix(): string | undefined {
    return (this.issue?.project?.prefix as string)
      ?? this.route.snapshot.pathFromRoot
        .map(snapshot => snapshot.paramMap.get('project'))
        .find(prefix => !!prefix) ?? undefined;
  }
}
