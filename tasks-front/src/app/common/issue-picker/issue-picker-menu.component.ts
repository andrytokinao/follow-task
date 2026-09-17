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
import { shareReplay } from 'rxjs/operators';
import {Issue, User} from '../../type/issue';
import { CountUpAnimator } from '../../utils/count-up.animator';
import { RenderedDirective } from './rendered.directive';
import { ContenuMenuDirective } from '../contenu-menu/contenu-menu.directive';
import { AvatarComponent } from '../avatar/avatar.component';
import { ProjectGuard } from '../../services/ProjectGuard';
import { IssueService } from '../../services/issue.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

/** Au-delà, les avatars se résument en « +n » pour garder la ligne lisible. */
const AVATARS_MAX = 3;

/** Choix émis en mode `simple` : l'issue et, pour une tâche, son projet. */
export interface IssueChoisie {
  issue: Issue;
  parent?: Issue;
}

// Arborescence d'issues affichée dans un seul mat-menu : dépliage inline
// (comme un sous-dossier), et deux façons de choisir :
//
// - mode `multiple` (par défaut, messagerie) : cases à cocher sur chaque
//   ligne, puis pied de menu "Créer" (lier les issues cochées) ;
// - mode `simple` (formulaire d'événement) : un clic choisit la ligne et
//   referme le menu.
//
// Options, toutes désactivées par défaut pour laisser la messagerie inchangée :
// `recherche` (filtre sur clé et titre) et `creationEnLigne` (liens « Nouvelle
// tâche » dans un projet, « Nouveau projet » pour les porteurs du droit).
//
// La création elle-même n'est pas faite ici : le type de demande est un choix
// obligatoire, que seul le formulaire complet (app-new-issue-form) propose.
// Le sélecteur émet une demande de création et l'hôte ouvre ce formulaire,
// via app-issue-creation-menu.
//
// Le pourcentage (barre + chiffre) et la durée passée sont animés : ils
// repartent de 0 (0% / 00:00) et montent jusqu'à la valeur réelle à CHAQUE
// ouverture du menu.
//
// Option `detailsTaches` : les tâches arrivent sans assignés ni avancement
// (liste des projets allégée). À l'ouverture d'un dossier, leur détail est
// chargé et s'affiche sur les lignes déjà présentes. Les tâches assignées à
// l'utilisateur connecté ressortent et passent en tête de leur dossier.
//
// Déclenchement : `mat-menu` n'expose aucune sortie `opened` (seulement
// `closed`). Le contenu est donc placé dans un `ng-template matMenuContent`,
// que Material détruit à la fermeture et recrée à l'ouverture ; la directive
// `(rendered)` posée dessus nous donne le hook d'ouverture. Le contenu vivant
// dans un CDK Overlay, chaque frame est suivie d'un markForCheck().
@Component({
  selector: 'app-issue-picker-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, MatMenuModule, RenderedDirective, ContenuMenuDirective, AvatarComponent],
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
  /** Liens de création : tâche dans un projet, projet selon les droits. */
  @Input() creationEnLigne = false;
  /** Fermer au clic extérieur. La messagerie le laisse ouvert. */
  @Input() hasBackdrop = false;
  /** Mode `simple` : l'issue actuellement choisie, mise en évidence. */
  @Input() issueCourante?: Issue;
  /** Charger assignés et avancement des tâches à l'ouverture d'un dossier. */
  @Input() detailsTaches = false;

  /** Mode `simple` : émis au clic sur une ligne. */
  @Output() issueChoisie = new EventEmitter<IssueChoisie>();
  /** « Nouvelle tâche » dans ce projet : l'hôte ouvre le formulaire de création. */
  @Output() creationTacheDemandee = new EventEmitter<Issue>();
  /** « Nouveau projet » : l'hôte ouvre le formulaire de création de projet. */
  @Output() creationProjetDemandee = new EventEmitter<void>();

  // Émis quand l'utilisateur valide via "Créer" : toutes les issues cochées,
  // parents et enfants confondus.
  @Output() issuesSelected = new EventEmitter<Issue[]>();


  @ViewChild('menu', { static: true }) menu!: MatMenu;

  private expandedKeys = new Set<string>();
  private selectedByKey = new Map<string, Issue>();

  // Compteurs animés : remplis à l'ouverture du menu (onMenuOpened) et
  // remis à zéro à la fermeture pour rejouer l'animation la fois suivante.
  private readonly counters: CountUpAnimator;

  terme = '';
  /** Même règle que partout ailleurs : gestionnaire de projet ou administrateur. */
  readonly peutCreerProjet$: Observable<boolean>;

  /** Détail des tâches par projet, chargé au dépliage (option detailsTaches). */
  private readonly tachesDetaillees = new Map<string, Issue[]>();
  private readonly chargementEnCours = new Set<string>();
  private utilisateurId?: string;

  // MessagingService était injecté sans être utilisé : il liait ce sélecteur à
  // la messagerie et empêchait de le réutiliser ailleurs.
  constructor(cdr: ChangeDetectorRef, zone: NgZone, projectGuard: ProjectGuard,
              private issueService: IssueService,
              private userService: UserService,
              authService: AuthService) {
    this.counters = new CountUpAnimator(zone, cdr);
    this.peutCreerProjet$ = projectGuard
      .hasCredential(['PROJECT_MANAGER', 'ADMIN'])
      .pipe(shareReplay(1));
    authService.connectedUser$.subscribe(user => this.utilisateurId = user?.id as string);
  }

  hasChildren(issue: Issue): boolean {
    return !!this.enfantsDe(issue).length;
  }

  /**
   * Tâches d'un projet : le détail chargé s'il existe, sinon celles reçues
   * avec la liste. Une tâche absente du détail — créée depuis, par exemple —
   * est conservée.
   */
  enfantsDe(issue: Issue): Issue[] {
    const recues = issue?.children ?? [];
    const detail = this.tachesDetaillees.get(this.keyOf(issue));
    if (!detail) {
      return recues;
    }
    const connues = new Set(detail.map(t => t.id));
    return [...detail, ...recues.filter(t => !connues.has(t.id))];
  }

  // ---------------------------------------------------------------------
  // Assignés, avancement, « à moi »
  // ---------------------------------------------------------------------

  /**
   * Assignés d'une issue : les memberships actifs de rôle ASSIGNEE ou ADMIN,
   * à défaut le champ historique `assigne`. Les observateurs ne comptent pas.
   */
  assignesDe(issue: Issue): User[] {
    const parUtilisateur = new Map<string, User>();
    (issue?.activeMemberships ?? [])
      .filter((m: any) => m?.user?.id && m.role !== 'OBSERVER')
      .forEach((m: any) => parUtilisateur.set(m.user.id, m.user));
    if (!parUtilisateur.size && issue?.assigne?.id) {
      parUtilisateur.set(issue.assigne.id as string, issue.assigne);
    }
    return [...parUtilisateur.values()];
  }

  avatarsVisibles(issue: Issue): User[] {
    return this.assignesDe(issue).slice(0, AVATARS_MAX);
  }

  avatarsMasques(issue: Issue): number {
    return Math.max(0, this.assignesDe(issue).length - AVATARS_MAX);
  }

  nomAssignes(issue: Issue): string {
    return this.assignesDe(issue).map(u => this.nomDe(u)).join(', ');
  }

  nomDe(user: User): string {
    const nom = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return nom || (user?.username as string) || '';
  }

  photoDe(user: User): string {
    return this.userService.getUrlPhoto(user);
  }

  /** La tâche vous est assignée : c'est elle qu'on vous propose en premier. */
  estAMoi(issue: Issue): boolean {
    return !!this.utilisateurId
      && this.assignesDe(issue).some(u => String(u.id) === String(this.utilisateurId));
  }

  /** Charge le détail des tâches d'un projet, une fois par ouverture du panneau. */
  private chargerDetails(projet: Issue): void {
    const cle = this.keyOf(projet);
    if (!this.detailsTaches || projet?.id == null
      || this.tachesDetaillees.has(cle) || this.chargementEnCours.has(cle)) {
      return;
    }
    this.chargementEnCours.add(cle);
    this.issueService.loadSubtaskResume(projet.id).subscribe(taches => {
      this.chargementEnCours.delete(cle);
      if (!taches?.length) {
        return;
      }
      this.tachesDetaillees.set(cle, taches);
      // Les lignes sont déjà affichées : on anime seulement leurs nouvelles
      // valeurs, sans relancer celles des autres dossiers.
      this.counters.ajouter(taches.map(t => ({
        key: this.keyOf(t),
        percent: t.currentCompletionPercent,
        minutes: t.elapsedDurationMinutes,
      })));
    });
  }

  estEnChargement(projet: Issue): boolean {
    return this.chargementEnCours.has(this.keyOf(projet));
  }

  parId(_index: number, element: Issue | User): unknown {
    return element?.id;
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
      this.chargerDetails(issue);
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
    this.fermer();
  }

  /** Fermeture sans raison « click » : rien n'est propagé à un menu parent. */
  private fermer(): void {
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
    let resultat = issues ?? [];
    if (terme && !(parent && this.correspond(parent, terme))) {
      resultat = resultat.filter(issue => this.correspond(issue, terme)
        || this.enfantsDe(issue).some(enfant => this.correspond(enfant, terme)));
    }
    // Dans un dossier, vos tâches d'abord : ce sont celles qu'on vient le plus
    // souvent chercher. L'ordre d'origine est gardé à l'intérieur de chaque
    // groupe. Les projets, eux, ne sont pas réordonnés.
    return parent ? this.vosTachesDabord(resultat) : resultat;
  }

  private vosTachesDabord(taches: Issue[]): Issue[] {
    const aMoi = taches.filter(t => this.estAMoi(t));
    return aMoi.length ? [...aMoi, ...taches.filter(t => !this.estAMoi(t))] : taches;
  }

  /** Pendant une recherche, un dossier dont une tâche correspond s'ouvre seul. */
  estDeplie(issue: Issue): boolean {
    if (this.isExpanded(issue)) {
      return true;
    }
    const terme = this.normaliser(this.terme);
    return !!terme && this.enfantsDe(issue).some(enfant => this.correspond(enfant, terme));
  }

  private correspond(issue: Issue, terme: string): boolean {
    return this.normaliser(`${issue.issueKey ?? ''} ${issue.summary ?? ''}`).includes(terme);
  }

  private normaliser(valeur: string): string {
    return (valeur ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
  }

  // ---------------------------------------------------------------------
  // Demandes de création
  // ---------------------------------------------------------------------

  /**
   * Le panneau se referme : le formulaire de création s'ouvre ensuite dans
   * son propre menu, et deux panneaux superposés se gêneraient.
   *
   * Fermeture avec la raison « click », cette fois : quand ce sélecteur est un
   * sous-menu (messagerie : menu d'actions du message → « Lier une issue »),
   * toute la chaîne se referme au lieu de laisser le menu d'actions ouvert
   * derrière le formulaire. Là où le sélecteur est isolé (appContenuMenu,
   * formulaire d'événement), rien d'autre n'est fermé.
   */
  demanderCreationTache(parent: Issue, event: Event): void {
    event.stopPropagation();
    this.creationTacheDemandee.emit(parent);
    this.menu.closed.emit('click');
  }

  demanderCreationProjet(): void {
    this.creationProjetDemandee.emit();
    this.menu.closed.emit('click');
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
    // Détail rechargé à chaque ouverture : l'avancement a pu bouger depuis.
    this.tachesDetaillees.clear();
    this.chargementEnCours.clear();
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
    // Après start(), qui remet les compteurs à zéro : le détail des dossiers
    // restés ouverts s'y ajoute ensuite sans être effacé.
    (this.issues ?? [])
      .filter(p => this.isExpanded(p))
      .forEach(p => this.chargerDetails(p));
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
