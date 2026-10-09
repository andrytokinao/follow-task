import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MatMenu} from "@angular/material/menu";
import {forkJoin, Subscription} from "rxjs";
import {Issue, IssueLink, LinkType} from "../../type/issue";
import {IssueLinkService} from "../../services/issue-link.service";
import {IssueService} from "../../services/issue.service";
import {IssueChoisie} from "../issue-picker/issue-picker-menu.component";

/** Relation proposée à l'ajout, lue depuis la tâche courante. */
export interface RelationChoix {
  type: LinkType;
  /** `sortant` : la tâche courante est la source (« bloque »). */
  sens: 'sortant' | 'entrant';
  libelle: string;
}

/** Lien vu depuis la tâche courante : le libellé dans son sens, et l'autre tâche. */
export interface LienAffiche {
  lien: IssueLink;
  libelle: string;
  autre: Issue;
}

/** Mêmes libellés que LinkType côté serveur, dans les deux sens. */
const RELATIONS: RelationChoix[] = [
  {type: 'BLOCKS', sens: 'sortant', libelle: 'bloque'},
  {type: 'BLOCKS', sens: 'entrant', libelle: 'est bloquée par'},
  {type: 'PRECEDES', sens: 'sortant', libelle: 'précède'},
  {type: 'PRECEDES', sens: 'entrant', libelle: 'suit'},
  {type: 'TRIGGERS', sens: 'sortant', libelle: 'déclenche'},
  {type: 'TRIGGERS', sens: 'entrant', libelle: 'est déclenchée par'},
  {type: 'RELATES_TO', sens: 'sortant', libelle: 'est liée à'},
];

/**
 * Tâches liées à une issue (bloque, précède, déclenche, simple référence),
 * dans un mat-menu.
 *
 * Comme app-issue-picker-menu, le composant n'a pas de déclencheur : l'hôte
 * pose le sien sur le menu exposé.
 *
 *   <button [matMenuTriggerFor]="liens.menu">Liens</button>
 *   <app-issue-link-menu #liens [issue]="issue"></app-issue-link-menu>
 *
 * Les liens sont rechargés à chaque ouverture. L'ajout passe par le
 * sélecteur de tâches ; le serveur refuse les boucles de dépendances et les
 * liens avec la tâche parente ou les sous-tâches, son message est affiché.
 */
@Component({
  standalone: false,
  selector: 'app-issue-link-menu',
  templateUrl: './issue-link-menu.component.html',
  styleUrl: './issue-link-menu.component.css'
})
export class IssueLinkMenuComponent implements OnInit, OnDestroy {
  @Input() issue: Issue;
  /** Masque l'ajout et le retrait : lecture seule. */
  @Input() lectureSeule = false;
  /** Clic sur une tâche liée : l'hôte décide de l'ouvrir. */
  @Output() issueOuverte = new EventEmitter<Issue>();
  /** Liens actifs à jour, entrants et sortants, après chaque chargement ou changement. */
  @Output() liensChange = new EventEmitter<IssueLink[]>();

  @ViewChild('menu', {static: true}) menu!: MatMenu;

  protected readonly relations = RELATIONS;
  protected relation: RelationChoix = RELATIONS[0];

  protected liens: LienAffiche[] = [];
  protected masters: Issue[] = [];
  protected chargement = false;
  protected enCours = false;
  protected erreur = '';

  private sortants: IssueLink[] = [];
  private entrants: IssueLink[] = [];
  private abonnement: Subscription;

  constructor(private issueLinkService: IssueLinkService,
              private issueService: IssueService) {
  }

  ngOnInit(): void {
    this.abonnement = this.issueService.issueMasterList$.subscribe(masters => this.masters = masters);
  }

  ngOnDestroy(): void {
    this.abonnement?.unsubscribe();
  }

  /** Appelé par (rendered) : une fois par ouverture du menu. */
  protected charger(): void {
    this.erreur = '';
    if (!this.issue?.id) {
      return;
    }
    this.chargement = true;
    forkJoin([
      this.issueLinkService.outgoingLinks(this.issue.id),
      this.issueLinkService.incomingLinks(this.issue.id)
    ]).subscribe({
      next: ([sortants, entrants]) => {
        this.sortants = sortants;
        this.entrants = entrants;
        this.rafraichir();
        this.chargement = false;
      },
      error: cause => {
        this.erreur = this.messageDe(cause, "Les liens n'ont pas pu être chargés.");
        this.chargement = false;
      }
    });
  }

  /** Choix dans le sélecteur : la tâche courante est source ou destination selon le sens. */
  protected lier(choix: IssueChoisie): void {
    const autre = choix.issue;
    if (this.enCours || !this.issue?.id || !autre?.id) {
      return;
    }
    if (autre.id === this.issue.id) {
      this.erreur = 'Une tâche ne peut pas être liée à elle-même.';
      return;
    }
    const sortant = this.relation.sens === 'sortant';
    const source = sortant ? this.issue.id : autre.id;
    const destination = sortant ? autre.id : this.issue.id;
    this.enCours = true;
    this.erreur = '';
    this.issueLinkService.link(source, destination, this.relation.type).subscribe({
      next: lien => {
        const liste = sortant ? this.sortants : this.entrants;
        if (!liste.some(l => l.id === lien.id)) {
          liste.push(lien);
        }
        this.rafraichir();
        this.enCours = false;
      },
      error: cause => {
        this.erreur = this.messageDe(cause, "Le lien n'a pas pu être créé.");
        this.enCours = false;
      }
    });
  }

  protected retirer(affiche: LienAffiche, event: Event): void {
    event.stopPropagation();
    const id = affiche.lien.id;
    if (this.enCours || id == null) {
      return;
    }
    this.enCours = true;
    this.erreur = '';
    this.issueLinkService.unlink(id).subscribe({
      next: () => {
        this.sortants = this.sortants.filter(l => l.id !== id);
        this.entrants = this.entrants.filter(l => l.id !== id);
        this.rafraichir();
        this.enCours = false;
      },
      error: cause => {
        this.erreur = this.messageDe(cause, "Le lien n'a pas pu être retiré.");
        this.enCours = false;
      }
    });
  }

  /** Le panneau se referme : l'hôte affiche la tâche à la place. */
  protected ouvrir(affiche: LienAffiche): void {
    this.issueOuverte.emit(affiche.autre);
    this.menu.closed.emit('click');
  }

  protected parId(_index: number, affiche: LienAffiche): unknown {
    return affiche.lien.id;
  }

  /** Liens vus depuis la tâche courante, regroupés par libellé. */
  private rafraichir(): void {
    const liens: LienAffiche[] = [
      ...this.sortants.map(lien => ({lien, libelle: lien.outwardLabel ?? '', autre: lien.destination as Issue})),
      ...this.entrants.map(lien => ({lien, libelle: lien.inwardLabel ?? '', autre: lien.source as Issue}))
    ];
    const ordre = RELATIONS.map(r => r.libelle);
    this.liens = liens.sort((a, b) => ordre.indexOf(a.libelle) - ordre.indexOf(b.libelle));
    this.liensChange.emit([...this.sortants, ...this.entrants]);
  }

  /** Premier libellé de son groupe : l'en-tête ne s'affiche qu'une fois. */
  protected debutGroupe(index: number): boolean {
    return index === 0 || this.liens[index - 1].libelle !== this.liens[index].libelle;
  }

  private messageDe(cause: any, defaut: string): string {
    return cause?.graphQLErrors?.[0]?.message || defaut;
  }
}
