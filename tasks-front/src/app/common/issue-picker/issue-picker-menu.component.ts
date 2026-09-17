import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { trigger, transition, style, animate } from '@angular/animations';
import { Observable } from 'rxjs';
import {Issue} from '../../type/issue';
import { CountUpAnimator } from '../../utils/count-up.animator';
import { RenderedDirective } from './rendered.directive';
import { ContenuMenuDirective } from '../contenu-menu/contenu-menu.directive';
import { IssueService } from '../../services/issue.service';
import { IssueCreationRapideService } from '../../services/issue-creation-rapide.service';

/** Choix émis en mode `simple` : l'issue et, pour une tâche, son projet. */
export interface IssueChoisie {
  issue: Issue;
  parent?: Issue;
}

// Arborescence d'issues affichée dans un seul mat-menu : dépliage inline
// (comme un sous-dossier), et deux façons de choisir :
//
// - mode `multiple` (par défaut, messagerie) : cases à cocher sur chaque
//   ligne, puis pied de menu "Créer" (lier les issues cochées) et
//   "Créer une nouvelle sous-issue" ;
// - mode `simple` (formulaire d'événement) : un clic choisit la ligne et
//   referme le menu.
//
// Options, toutes désactivées par défaut pour laisser la messagerie inchangée :
// `recherche` (filtre sur clé et titre) et `creationEnLigne` (nouvelle tâche
// dans un projet, nouveau projet pour les porteurs du droit).
//
// Le pourcentage (barre + chiffre) et la durée passée sont animés : ils
// repartent de 0 (0% / 00:00) et montent jusqu'à la valeur réelle à CHAQUE
// ouverture du menu.
//
// Déclenchement : `mat-menu` n'expose aucune sortie `opened` (seulement
// `closed`). Le contenu est donc placé dans un `ng-template matMenuContent`,
// que Material détruit à la fermeture et recrée à l'ouverture ; la directive
// `(rendered)` posée dessus nous donne le hook d'ouverture. Le contenu vivant
// dans un CDK Overlay, chaque frame est suivie d'un markForCheck().
@Component({
  selector: 'app-issue-picker-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, MatMenuModule, RenderedDirective, ContenuMenuDirective],
  templateUrl: './issue-picker-menu.component.html',
  styleUrls: ['./issue-picker-menu.component.scss'],
  animations: [
    // Dépliage/repliage fluide des sous-issues (au lieu d'un *ngIf sec)
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('180ms cubic-bezier(0.4, 0, 0.2, 1)', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('150ms cubic-bezier(0.4, 0, 1, 1)', style({ height: '0', opacity: 0 })),
      ]),
    ]),
    // Petit effet de "pop" sur la coche quand on sélectionne
    trigger('checkPop', [
      transition(':enter', [
        style({ transform: 'scale(0)' }),
        animate('160ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)' })),
      ]),
    ]),
  ],
})
export class IssuePickerMenuComponent {
  @Input() issues: Issue[] = [];

  /** `multiple` : cases à cocher et validation. `simple` : un clic choisit. */
  @Input() mode: 'multiple' | 'simple' = 'multiple';
  /** Champ de recherche en tête du panneau. */
  @Input() recherche = false;
  /** Création sur place : tâche dans un projet, projet selon les droits. */
  @Input() creationEnLigne = false;
  /** Fermer au clic extérieur. La messagerie le laisse ouvert. */
  @Input() hasBackdrop = false;
  /** Mode `simple` : l'issue actuellement choisie, mise en évidence. */
  @Input() issueCourante?: Issue;

  /** Mode `simple` : émis au clic sur une ligne, ou après une création. */
  @Output() issueChoisie = new EventEmitter<IssueChoisie>();

  // Émis quand l'utilisateur valide via "Créer" : toutes les issues cochées,
  // parents et enfants confondus.
  @Output() issuesSelected = new EventEmitter<Issue[]>();

  // Émis quand l'utilisateur clique "Créer une nouvelle sous-issue".
  // Si une seule issue est cochée au moment du clic, elle est passée comme
  // parent pressenti ; sinon `null` (le consommateur devra la demander).
  @Output() createSubIssueRequested = new EventEmitter<Issue | null>();

  @ViewChild('menu', { static: true }) menu!: MatMenu;

  private expandedKeys = new Set<string>();
  private selectedByKey = new Map<string, Issue>();

  // Compteurs animés : remplis à l'ouverture du menu (onMenuOpened) et
  // remis à zéro à la fermeture pour rejouer l'animation la fois suivante.
  private readonly counters: CountUpAnimator;

  // État de la recherche et de la création en ligne.
  terme = '';
  creationDans?: string;
  creationProjetOuverte = false;
  libelle = '';
  enCreation = false;
  erreur = '';
  readonly peutCreerProjet$: Observable<boolean>;

  // MessagingService était injecté sans être utilisé : il liait ce sélecteur à
  // la messagerie et empêchait de le réutiliser ailleurs.
  constructor(cdr: ChangeDetectorRef, zone: NgZone,
              private creation: IssueCreationRapideService,
              private issueService: IssueService) {
    this.counters = new CountUpAnimator(zone, cdr);
    this.peutCreerProjet$ = creation.peutCreerProjet$;
  }

  hasChildren(issue: Issue): boolean {
    return !!issue.children?.length;
  }

  private keyOf(issue: Issue): string {
    return String(issue.id ?? issue.issueKey);
  }

  isExpanded(issue: Issue): boolean {
    return this.expandedKeys.has(this.keyOf(issue));
  }

  isSelected(issue: Issue): boolean {
    return this.selectedByKey.has(this.keyOf(issue));
  }

  get selectionCount(): number {
    return this.selectedByKey.size;
  }

  // Déplie/replie sans toucher à la sélection ni fermer le menu.
  toggleExpand(issue: Issue, event: Event): void {
    event.stopPropagation();
    const key = this.keyOf(issue);
    if (this.expandedKeys.has(key)) {
      this.expandedKeys.delete(key);
    } else {
      this.expandedKeys.add(key);
    }
  }

  // Coche/décoche la ligne. Reste indépendant du dépliage : une issue
  // repliée avec des enfants peut quand même être sélectionnée elle-même.
  toggleSelect(issue: Issue, event: Event): void {
    event.stopPropagation();
    const key = this.keyOf(issue);
    if (this.selectedByKey.has(key)) {
      this.selectedByKey.delete(key);
    } else {
      this.selectedByKey.set(key, issue);
    }
  }

  onCreateClick(): void {
    if (this.selectedByKey.size === 0) return;
    this.issuesSelected.emit(Array.from(this.selectedByKey.values()));
    this.selectedByKey.clear();
  }

  onCreateSubIssueClick(): void {
    const selected = Array.from(this.selectedByKey.values());
    this.createSubIssueRequested.emit(selected.length === 1 ? selected[0] : null);
  }

  // ---------------------------------------------------------------------
  // Mode simple : un clic choisit
  // ---------------------------------------------------------------------

  /** Clic sur une ligne : cocher en mode multiple, choisir en mode simple. */
  onLigneClic(issue: Issue, parent: Issue | undefined, event: Event): void {
    if (this.mode === 'simple') {
      event.stopPropagation();
      this.choisir(issue, parent);
      return;
    }
    this.toggleSelect(issue, event);
  }

  estCourante(issue: Issue): boolean {
    return this.mode === 'simple' && this.issueCourante?.id != null
      && this.issueCourante.id === issue.id;
  }

  private choisir(issue: Issue, parent?: Issue): void {
    this.issueChoisie.emit({issue, parent});
    this.annulerCreation();
    // Fermeture sans raison « click » : rien n'est propagé à un menu parent.
    this.menu.closed.emit();
  }

  /**
   * Un projet peut s'ouvrir même vide quand la création est permise : c'est
   * là qu'on ajoute sa première tâche.
   */
  peutDeplier(issue: Issue, depth: number): boolean {
    return this.hasChildren(issue) || (this.creationEnLigne && depth === 0);
  }

  // ---------------------------------------------------------------------
  // Recherche
  // ---------------------------------------------------------------------

  /**
   * Un projet reste affiché si lui-même ou l'une de ses tâches correspond :
   * chercher une tâche ne doit pas masquer son dossier. Sous un projet qui
   * correspond, toutes ses tâches restent visibles.
   */
  filtrer(issues: Issue[], parent?: Issue): Issue[] {
    const terme = this.normaliser(this.terme);
    if (!terme || !issues) {
      return issues ?? [];
    }
    if (parent && this.correspond(parent, terme)) {
      return issues;
    }
    return issues.filter(issue => this.correspond(issue, terme)
      || (issue.children ?? []).some(enfant => this.correspond(enfant, terme)));
  }

  /** Pendant une recherche, un dossier dont une tâche correspond s'ouvre seul. */
  estDeplie(issue: Issue): boolean {
    if (this.isExpanded(issue)) {
      return true;
    }
    const terme = this.normaliser(this.terme);
    return !!terme && (issue.children ?? []).some(enfant => this.correspond(enfant, terme));
  }

  private correspond(issue: Issue, terme: string): boolean {
    return this.normaliser(`${issue.issueKey ?? ''} ${issue.summary ?? ''}`).includes(terme);
  }

  private normaliser(valeur: string): string {
    return (valeur ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
  }

  // ---------------------------------------------------------------------
  // Création en ligne
  // ---------------------------------------------------------------------

  ouvrirCreationTache(parent: Issue, event: Event): void {
    event.stopPropagation();
    this.annulerCreation();
    this.expandedKeys.add(this.keyOf(parent));
    this.creationDans = this.keyOf(parent);
  }

  ouvrirCreationProjet(): void {
    this.annulerCreation();
    this.creationProjetOuverte = true;
  }

  estCreationDans(parent: Issue): boolean {
    return this.creationDans === this.keyOf(parent);
  }

  annulerCreation(): void {
    this.creationDans = undefined;
    this.creationProjetOuverte = false;
    this.libelle = '';
    this.erreur = '';
  }

  /** Échap annule la saisie sans refermer tout le panneau. */
  onEchapSaisie(event: Event): void {
    event.stopPropagation();
    this.annulerCreation();
  }

  /** La tâche créée est aussitôt choisie : on la crée pour s'en servir. */
  creerTache(parent: Issue): void {
    if (!this.libelle.trim() || this.enCreation) {
      return;
    }
    this.enCreation = true;
    this.erreur = '';
    this.creation.creerTache(parent, this.libelle).subscribe({
      next: cree => {
        this.enCreation = false;
        // Visible tout de suite ; le rechargement met ensuite toute
        // l'application à jour.
        parent.children = [...(parent.children ?? []), cree];
        this.issueService.refreshIssueListMasters();
        this.choisir(cree, parent);
      },
      error: (err: Error) => {
        this.enCreation = false;
        this.erreur = err?.message ?? 'Création impossible.';
      }
    });
  }

  creerProjet(): void {
    if (!this.libelle.trim() || this.enCreation) {
      return;
    }
    this.enCreation = true;
    this.erreur = '';
    this.creation.creerProjet(this.libelle).subscribe({
      next: cree => {
        this.enCreation = false;
        this.issues = [...(this.issues ?? []), cree];
        this.issueService.refreshIssueListMasters();
        this.choisir(cree);
      },
      error: (err: Error) => {
        this.enCreation = false;
        this.erreur = err?.message ?? 'Création impossible.';
      }
    });
  }

  progressClass(percent: number | null | undefined): string {
    const p = percent ?? 0;
    if (p >= 70) return 'progress-high';
    if (p >= 30) return 'progress-mid';
    return 'progress-low';
  }

  hasPercent(issue: Issue): boolean {
    return issue.currentCompletionPercent !== undefined && issue.currentCompletionPercent !== null;
  }

  hasDuration(issue: Issue): boolean {
    return issue.elapsedDurationMinutes !== undefined && issue.elapsedDurationMinutes !== null;
  }

  // ---------------------------------------------------------------------
  // Cycle de vie du menu
  // ---------------------------------------------------------------------

  // Appelé par (rendered) sur le contenu paresseux : une fois par ouverture.
  onMenuOpened(): void {
    this.terme = '';
    this.annulerCreation();
    // Mode simple : le dossier contenant le choix courant s'ouvre, pour le
    // montrer sans avoir à le chercher.
    if (this.mode === 'simple' && this.issueCourante?.id != null) {
      const parent = (this.issues ?? []).find(p =>
        (p.children ?? []).some(enfant => enfant.id === this.issueCourante!.id));
      if (parent) {
        this.expandedKeys.add(this.keyOf(parent));
      }
    }
    this.counters.start(
      this.collectAllIssues(this.issues).map(issue => ({
        key: this.keyOf(issue),
        percent: issue.currentCompletionPercent,
        minutes: issue.elapsedDurationMinutes,
      })),
    );
  }

  onMenuClosed(): void {
    this.counters.reset();
  }

  // Aplatit l'arbre (parents + enfants, quel que soit l'état déplié/replié)
  // pour que les issues repliées aient déjà leur valeur prête si l'utilisateur
  // déplie juste après l'ouverture.
  private collectAllIssues(issues: Issue[]): Issue[] {
    const all: Issue[] = [];
    const walk = (list: Issue[]) => {
      for (const issue of list) {
        all.push(issue);
        if (issue.children?.length) walk(issue.children);
      }
    };
    walk(issues ?? []);
    return all;
  }

  // ---------------------------------------------------------------------
  // Lecture des valeurs animées (utilisées telles quelles dans le template)
  // ---------------------------------------------------------------------

  animatedPercent(issue: Issue): number {
    return this.counters.percentFor(this.keyOf(issue));
  }

  animatedDurationLabel(issue: Issue): string {
    return this.formatMinutes(this.counters.minutesFor(this.keyOf(issue)));
  }

  private formatMinutes(totalMinutes: number): string {
    const safe = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
