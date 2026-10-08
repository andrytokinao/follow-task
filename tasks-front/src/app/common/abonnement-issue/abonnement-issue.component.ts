import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subscription} from "rxjs";
import {Issue} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {AuthService} from "../../services/auth.service";

/**
 * Bouton d'abonnement a une issue (master ou sous-tache).
 *
 * S'abonner, c'est entrer dans observerIds : la liste des personnes notifiees
 * a chaque evenement de l'issue. Les assignes y sont deja ; le bouton permet a
 * n'importe qui de suivre l'issue, ou de cesser de la suivre.
 *
 * L'issue recue est mise a jour sur place : un enregistrement ulterieur de
 * l'issue par l'ecran parent renverra donc la liste a jour, sans ecraser
 * l'abonnement.
 */
@Component({
  standalone: false,
  selector: 'app-abonnement-issue',
  templateUrl: './abonnement-issue.component.html',
  styleUrl: './abonnement-issue.component.css'
})
export class AbonnementIssueComponent implements OnInit, OnDestroy {
  @Input() issue: Issue;
  /** Icone seule, le libelle passe dans l'infobulle. */
  @Input() compact = false;
  /** observerIds a jour apres chaque changement. */
  @Output() abonnementChange = new EventEmitter<string[]>();

  protected enCours = false;
  protected erreur = '';

  private userId: string;
  private abonnement: Subscription;

  constructor(private issueService: IssueService,
              private authService: AuthService) {
  }

  ngOnInit(): void {
    this.abonnement = this.authService.profile$.subscribe(profile => this.userId = profile?.id);
  }

  ngOnDestroy(): void {
    this.abonnement?.unsubscribe();
  }

  protected get abonne(): boolean {
    return !!this.userId && (this.issue?.observerIds || []).some(id => id === this.userId);
  }

  protected get libelle(): string {
    return this.abonne ? 'Abonné' : "S'abonner";
  }

  protected get infobulle(): string {
    if (this.erreur) {
      return this.erreur;
    }
    return this.abonne
      ? 'Vous recevez les notifications de cette tâche. Cliquer pour vous désabonner.'
      : 'Recevoir les notifications de cette tâche.';
  }

  protected basculer(event: Event): void {
    // Le bouton vit souvent dans une ligne ou une carte cliquable : le clic ne
    // doit pas aussi ouvrir la tache.
    event.stopPropagation();
    if (this.enCours || !this.issue?.id || !this.userId) {
      return;
    }
    this.enCours = true;
    this.erreur = '';
    this.issueService.abonnerIssue(this.issue.id, !this.abonne).subscribe({
      next: observerIds => {
        this.issue.observerIds = observerIds;
        this.abonnementChange.emit(observerIds);
        this.enCours = false;
      },
      error: cause => {
        this.erreur = cause?.graphQLErrors?.[0]?.message || "L'abonnement n'a pas pu être modifié.";
        this.enCours = false;
      }
    });
  }
}
