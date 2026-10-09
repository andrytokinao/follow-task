import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subscription} from "rxjs";
import {Issue, User} from "../../type/issue";
import {userDisplayName} from "../../type/issue-grouping.util";
import {IssueService} from "../../services/issue.service";
import {AuthService} from "../../services/auth.service";
import {UserService} from "../../services/user.service";

/**
 * Abonnement a une issue (master ou sous-tache), dans un mat-menu.
 *
 * S'abonner, c'est entrer dans observerIds : la liste des personnes notifiees
 * a chaque evenement de l'issue. Les assignes y sont deja. Le menu montre qui
 * suit l'issue et permet a n'importe qui de la suivre, ou de cesser de la
 * suivre : chacun ne gere que son propre abonnement.
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
  private membres: User[] = [];
  private abonnements: Subscription[] = [];

  constructor(private issueService: IssueService,
              private authService: AuthService,
              private userService: UserService) {
  }

  ngOnInit(): void {
    this.abonnements.push(
      this.authService.profile$.subscribe(profile => this.userId = profile?.id),
      this.userService.allMembers$.subscribe((users: any) => this.membres = users || [])
    );
  }

  ngOnDestroy(): void {
    this.abonnements.forEach(abonnement => abonnement.unsubscribe());
  }

  protected get abonne(): boolean {
    return !!this.userId && this.observerIds.some(id => this.memeId(id, this.userId));
  }

  protected get libelle(): string {
    return this.abonne ? 'Abonné' : "S'abonner";
  }

  protected get infobulle(): string {
    if (this.erreur) {
      return this.erreur;
    }
    const nombre = this.observerIds.length;
    return (this.abonne ? 'Vous suivez cette tâche' : 'Suivre cette tâche')
      + (nombre ? ` · ${nombre} abonné(s)` : '');
  }

  protected get nombre(): number {
    return this.observerIds.length;
  }

  /**
   * Abonnes connus parmi les membres, l'utilisateur connecte en tete. Un
   * identifiant absent des membres (compte retire) n'est pas affiche, mais
   * reste compte dans le total.
   */
  protected get abonnes(): User[] {
    const users = this.observerIds
      .map(id => this.membres.find(user => this.memeId(user.id, id)))
      .filter(user => user != null) as User[];
    return users.sort((a, b) => Number(this.estMoi(b)) - Number(this.estMoi(a)));
  }

  protected estMoi(user: User): boolean {
    return !!this.userId && this.memeId(user?.id, this.userId);
  }

  protected displayName(user: User): string {
    return userDisplayName(user);
  }

  /** null sans photo : app-avatar genere alors des initiales. */
  protected photoUrl(user: User): string | null {
    return user && user.photo ? this.userService.getUrlPhoto(user) : null;
  }

  /**
   * Le bouton vit souvent dans une ligne ou une carte cliquable : ouvrir le
   * menu ne doit pas aussi ouvrir la tache.
   */
  protected arreter(event: Event): void {
    event.stopPropagation();
  }

  protected basculer(event: Event): void {
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

  private get observerIds(): String[] {
    return this.issue?.observerIds || [];
  }

  private memeId(a: unknown, b: unknown): boolean {
    return a != null && b != null && String(a).toLowerCase() === String(b).toLowerCase();
  }
}
