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
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { trigger, transition, style, animate } from '@angular/animations';
import {Issue, MessageApp} from '../../type/issue';
import { CountUpAnimator } from '../../utils/count-up.animator';
import { RenderedDirective } from './rendered.directive';
import {MessagingService} from "../../services/messaging.service";

// Arborescence d'issues affichée dans un seul mat-menu : dépliage inline
// (comme un sous-dossier), sélection multiple par case à cocher sur
// chaque ligne (parent ou enfant), et un pied de menu avec les actions
// "Créer" (lier les issues cochées) et "Créer une nouvelle sous-issue".
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
  imports: [CommonModule, MatMenuModule, RenderedDirective],
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

  constructor(cdr: ChangeDetectorRef, zone: NgZone,private messagingService:MessagingService) {
    this.counters = new CountUpAnimator(zone, cdr);
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
