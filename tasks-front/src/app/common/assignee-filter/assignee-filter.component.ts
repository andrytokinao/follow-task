import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';
import {Issue, User} from "../../type/issue";
import {UserService} from "../../services/user.service";
import {AssigneeCount, countAssignees, UNASSIGNED_ID, userDisplayName} from "../../type/issue-grouping.util";

/**
 * Rangée d'avatars des assignés d'une liste d'issues, avec leur nombre de
 * tâches : un clic ajoute ou retire la personne de la sélection. Le
 * composant ne filtre rien lui-même — il expose la sélection, que le parent
 * applique avec `filterByAssignees`.
 */
@Component({
  standalone: false,
  selector: 'app-assignee-filter',
  templateUrl: './assignee-filter.component.html',
  styleUrl: './assignee-filter.component.css'
})
export class AssigneeFilterComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() issues: Issue[] = [];
  /** identifiants retenus ; `UNASSIGNED_ID` pour les issues sans assigné */
  @Input() selectedIds: string[] = [];
  @Output() selectedIdsChange = new EventEmitter<string[]>();
  /**
   * Personnes à proposer même sans tâche dans `issues` (les membres d'un espace
   * de travail, par exemple) : elles suivent les assignés, avec un compte nul.
   * Vide par défaut : seuls les assignés sont alors proposés.
   */
  @Input() users: User[] = [];
  /**
   * Nombre d'avatars affichés en rangée ; les autres passent dans un menu
   * « +N » à sélection multiple. Null par défaut : tout le monde en rangée.
   */
  @Input() maxVisible: number | null = null;
  /**
   * Vrai : autant d'avatars que la largeur du composant en laisse, au moins
   * un, les autres dans « +N ». Le parent doit alors lui donner une largeur
   * qui ne dépend pas de son contenu (`flex: 1 1 0; min-width: 0`).
   */
  @Input() adapterALaLargeur = false;

  readonly UNASSIGNED_ID = UNASSIGNED_ID;
  assignees: AssigneeCount[] = [];
  /** Personnes de la rangée : toutes, ou les premières qui tiennent. */
  visibles: AssigneeCount[] = [];
  /** Personnes du menu « +N ». */
  masques: AssigneeCount[] = [];
  unassigned = 0;

  /** Places d'avatar que laisse la largeur ; null tant qu'elle n'est pas mesurée. */
  private placesMesurees: number | null = null;
  private observateur?: ResizeObserver;

  constructor(private userService: UserService,
              private hote: ElementRef<HTMLElement>,
              private zone: NgZone) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['issues'] || changes['users']) {
      const counts = countAssignees(this.issues);
      const sansTache = (this.users || [])
        .filter(user => user?.id && !counts.assignees.some(entry => entry.user.id == user.id))
        .map(user => ({user, count: 0}));
      this.assignees = [...counts.assignees, ...sansTache];
      this.unassigned = counts.unassigned;
    }
    if (changes['issues'] || changes['users'] || changes['maxVisible']) {
      this.repartir();
    }
  }

  ngAfterViewInit(): void {
    if (!this.adapterALaLargeur || typeof ResizeObserver === 'undefined') {
      return;
    }
    this.observateur = new ResizeObserver(entrees => {
      const places = placesPour(entrees[0].contentRect.width, this.unassigned > 0);
      if (places !== this.placesMesurees) {
        this.zone.run(() => {
          this.placesMesurees = places;
          this.repartir();
        });
      }
    });
    this.observateur.observe(this.hote.nativeElement);
  }

  ngOnDestroy(): void {
    this.observateur?.disconnect();
  }

  /** Rangée et menu « +N », selon maxVisible et la largeur mesurée. */
  private repartir(): void {
    if (this.adapterALaLargeur && this.placesMesurees != null) {
      const places = Math.min(this.placesMesurees, this.maxVisible ?? Infinity);
      const coupe = this.assignees.length > places;
      // Le « +N » prend une place ; il reste toujours au moins une personne visible.
      const visibles = coupe ? Math.max(1, places - 1) : this.assignees.length;
      this.visibles = this.assignees.slice(0, visibles);
      this.masques = this.assignees.slice(visibles);
      return;
    }
    // Plus d'une personne à masquer : sinon le « +1 » prendrait la place d'un avatar.
    const coupe = this.maxVisible != null && this.assignees.length > this.maxVisible + 1;
    this.visibles = coupe ? this.assignees.slice(0, this.maxVisible!) : this.assignees;
    this.masques = coupe ? this.assignees.slice(this.maxVisible!) : [];
  }

  get hasSelection(): boolean {
    return (this.selectedIds || []).length > 0;
  }

  /** Une personne du menu « +N » est retenue : le bouton le montre. */
  get selectionMasquee(): boolean {
    return this.masques.some(entry => this.isSelected(entry.user.id));
  }

  isSelected(id: string): boolean {
    return (this.selectedIds || []).includes(id);
  }

  toggle(id: string): void {
    const ids = this.isSelected(id)
      ? this.selectedIds.filter(selected => selected != id)
      : [...(this.selectedIds || []), id];
    this.emit(ids);
  }

  clear(): void {
    this.emit([]);
  }

  displayName(user: User): string {
    return userDisplayName(user);
  }

  /** null sans photo : app-avatar génère alors des initiales colorées. */
  photoUrl(user: User): string | null {
    return user && user.photo ? this.userService.getUrlPhoto(user) : null;
  }

  trackByAssignee(_index: number, entry: AssigneeCount): string {
    return entry.user.id;
  }

  private emit(ids: string[]): void {
    this.selectedIds = ids;
    this.selectedIdsChange.emit(ids);
  }
}

/** Largeur d'une place d'avatar : --af-size (28) + écart (6). Voir la feuille de styles. */
const LARGEUR_PLACE = 34;
/** « Tous » et le padding de la rangée. */
const LARGEUR_FIXE = 56;

/** Places d'avatar (« +N » compris) dans cette largeur ; la case « Non assigné » en prend une. */
function placesPour(largeur: number, avecNonAssigne: boolean): number {
  const libre = largeur - LARGEUR_FIXE - (avecNonAssigne ? LARGEUR_PLACE : 0);
  return Math.max(1, Math.floor(libre / LARGEUR_PLACE));
}
