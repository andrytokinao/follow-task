import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from '../avatar/avatar.component';
import {MessageDto, MessageDayGroup, IssueMessageLink} from '../../models/messaging.model';
import { groupMessagesByDay } from '../../utils/message-day-group.util';
import { CountUpAnimator } from '../../utils/count-up.animator';
import {Issue, MessageApp} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {MessagingService} from "../../services/messaging.service";
import {IssuePickerMenuComponent} from "../issue-picker/issue-picker-menu.component";

const LONG_PRESS_MS = 450;

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [CommonModule, AvatarComponent, MatMenuModule, RouterLink, IssuePickerMenuComponent],
  templateUrl: './message-thread.component.html',
  styleUrls: ['./message-thread.component.scss'],
})
export class MessageThreadComponent implements OnChanges {
  @Input() messages: MessageApp[] = [];
  @Input() isGroup = false;

  // Liens d'issues résolus par le parent : externalMessageId -> issues liées
  @Input() issueLinksByMessage: Map<string, IssueMessageLink[]> = new Map();

  // La liaison elle-même est faite ici via MessagingService (plus de dialogue
  // externe) ; on informe simplement le parent que ça vient de se produire,
  // au cas où il doive rafraîchir un compteur, une liste, etc.
  @Output() issuesLinked = new EventEmitter<{ messages: MessageApp[]; issues: Issue[] }>();
  @Output() unlinkIssueFromMessage = new EventEmitter<IssueMessageLink>();

  // Relaie la demande de création de sous-issue au parent, qui gère le
  // formulaire/dialogue de création. `parent` est l'issue pressentie comme
  // parente si une seule était cochée au moment du clic, sinon null.
  @Output() createSubIssueRequested = new EventEmitter<{ parent: Issue | null }>();

  dayGroups: MessageDayGroup[] = [];

  // Id du message dont le popover d'issue est ouvert
  openIssuePopoverFor: string | null = null;

  // ---- Mode sélection multiple ----
  selectionMode = false;
  selectedMessageIds = new Set<string>();

  // Liste racine des issues, utilisée par tous les pickers (par message et
  // celui de la barre de sélection groupée).
  masters: Issue[] = [];

  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTriggered = false;

  // Compteurs animés du popover de détail : le pourcentage et la durée
  // repartent de 0 à chaque ouverture et montent jusqu'à leur valeur réelle.
  private readonly counters: CountUpAnimator;

  constructor(
    private issueService: IssueService,
    private messagingService: MessagingService,
    zone: NgZone,
    cdr: ChangeDetectorRef,
  ) {
    this.counters = new CountUpAnimator(zone, cdr);
    this.issueService.issueMasterList$.subscribe(masters => {
      this.masters = masters;
    });
  }

  ngOnChanges(): void {
    // Les messages arrivent sous deux formes selon leur origine (DB locale
    // "MessageApp" avec `created`/`messageLinks`, ou provider live "Message"
    // avec `createdAt`/`attachments`/`fromMe`, sans `messageLinks`).
    // On normalise ici pour que le reste du composant n'ait plus à gérer
    // cette hétérogénéité.
    const normalized = this.messages.map(m => this.normalizeMessage(m));
    this.dayGroups = groupMessagesByDay(normalized);
  }

  private normalizeMessage(msg: any): MessageApp {
    return {
      ...msg,
      created: msg.created ?? msg.createdAt ?? null,
      messageLinks: msg.messageLinks ?? [],
      sender: msg.sender ?? null,
    };
  }

  // Ferme le popover au clic en dehors du composant. Les clics qui doivent
  // rester "internes" (ouverture depuis un chip, actions dans le popover)
  // appellent déjà $event.stopPropagation(), donc ils n'atteignent jamais
  // ce listener document.
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.openIssuePopoverFor !== null) {
      this.closeIssuePopover();
    }
  }

  shouldShowAvatar(msgs: MessageApp[], index: number): boolean {
    const current = msgs[index];
    if (this.isFromMe(current)) return false;

    // Sans sender résolu, pas d'id stable pour grouper les bulles
    // consécutives d'un même expéditeur -> on affiche l'avatar (avec le
    // fallback nom/photo) à chaque message plutôt que de risquer de le
    // masquer à tort entre deux personnes différentes.
    if (!current.sender) return true;

    if (!this.isGroup) {
      return index === 0;
    }
    if (index === 0) return true;
    const previous = msgs[index - 1];
    return this.senderKey(previous) !== this.senderKey(current);
  }

  private senderKey(msg: MessageApp): string {
    return msg.sender?.id != null
      ? String(msg.sender.id)
      : this.displayNameFor(msg);
  }

  // Nom affiché pour un message : sender résolu (User interne) en priorité,
  // sinon fallbackSenderName (champ typé, prévu pour ça côté "MessageApp"),
  // sinon senderDisplayName (champ brut du provider côté "Message"),
  // sinon "Inconnu". Sert aussi de base aux initiales générées par
  // app-avatar quand il n'y a pas de photo.
  displayNameFor(msg: MessageApp): string {
    return msg.sender?.firstName
      || msg.sender?.username
      || msg.fallbackSenderName
      || (msg as any).senderDisplayName
      || 'Inconnu';
  }

  avatarPhotoFor(msg: MessageApp): string | null {
    return msg.sender?.photo
      || (msg as any).senderAvatarUrl
      || null;
  }

  hasIssues(message: MessageApp): boolean {
    return (message.messageLinks ?? []).length > 0;
  }

  toggleIssuePopover(message: MessageApp, event: Event): void {
    event.stopPropagation();
    if (this.selectionMode) return;
    const wasOpen = this.openIssuePopoverFor === message.externalMessageId;
    this.openIssuePopoverFor = wasOpen ? null : message.externalMessageId ?? null;

    if (wasOpen) {
      this.counters.reset();
      return;
    }
    // Ouverture : relance les compteurs pour les issues affichées.
    this.counters.start(
      (message.messageLinks ?? []).map(link => ({
        key: this.issueKeyOf(link),
        percent: link.issue.currentCompletionPercent,
        minutes: link.issue.elapsedDurationMinutes,
      })),
    );
  }

  closeIssuePopover(): void {
    this.openIssuePopoverFor = null;
    this.counters.reset();
  }

  // URL de consultation de l'issue liée, ou null si elle n'est pas cliquable
  // (autre projet que le projet courant). La construction est centralisée
  // dans IssueService.
  issueUrl(link: IssueMessageLink): string | null {
    return this.issueService.getIssueUrl(link.issue);
  }

  private issueKeyOf(link: IssueMessageLink): string {
    return String(link.issue.id ?? link.issue.issueKey);
  }

  // Valeurs animées lues par le template du popover.
  animatedPercent(link: IssueMessageLink): number {
    return this.counters.percentFor(this.issueKeyOf(link));
  }

  animatedDuration(link: IssueMessageLink): string {
    // formatDuration renvoie '' à 0 : on affiche "0min" pour que la ligne ne
    // reste pas vide sur les premières frames de la montée.
    return this.formatDuration(this.counters.minutesFor(this.issueKeyOf(link))) || '0min';
  }

  onUnlinkIssue(link: IssueMessageLink, event: Event): void {
    event.stopPropagation();
    this.unlinkIssueFromMessage.emit(link);
    this.closeIssuePopover();
  }

  progressClass(percent: number | null | undefined): string {
    const p = percent ?? 0;
    if (p >= 70) return 'progress-high';
    if (p >= 30) return 'progress-mid';
    return 'progress-low';
  }

  isCompleted(link: IssueMessageLink): boolean {
    return (link.issue.currentCompletionPercent ?? 0) >= 100;
  }

  // Formatte une durée en minutes en texte court : "2h30", "3h", "45min".
  formatDuration(minutes: number | null | undefined): string {
    if (!minutes || minutes <= 0) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h${m.toString().padStart(2, '0')}`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  }

  assigneeInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  protected isFromMe(msg: MessageApp): boolean {
    // Renvoyé directement par le provider live (typename "Message").
    // Pour les messages "MessageApp" (persistés en DB), ce champ n'existe
    // pas encore côté backend -> reste `false` en attendant de comparer
    // via l'utilisateur courant.
    return !!(msg as any).fromMe;
  }

  protected hasAttachment(msg: MessageApp): boolean {
    return !!(msg as any).hasAttachment || !!(msg as any).attachments?.length;
  }

  // ==================== Liaison d'issue ====================

  // Appelé quand une ou plusieurs issues sont validées via "Créer" dans le
  // picker rattaché à un message précis (mode normal, hors sélection).
  onIssuesPickedForSingle(msg: MessageApp, issues: Issue[]): void {
     this.linkIssue(issues, [msg]);
  }

  // Appelé quand une ou plusieurs issues sont validées via "Créer" dans le
  // picker de la barre de sélection groupée.
  onIssuesPickedForSelection(issues: Issue[]): void {
    if (this.selectedMessageIds.size === 0) return;
    const selected = this.dayGroups
      .flatMap(group => group.messages)
      .filter(msg => this.isSelected(msg));
    this.linkIssue(issues, selected)
    this.cancelSelection();
  }

  onCreateSubIssueRequested(parent: Issue | null): void {
    this.createSubIssueRequested.emit({ parent });
  }

  private linkIssue(issues: Issue[], messages: MessageApp[]): void {
    let issueIds:number[] = issues.map(issue => issue.id);
    let externalMessageId:String[] = messages.map(message => message.externalMessageId);
    this.messagingService.linkIssuesToMessages(issueIds, externalMessageId).subscribe(() => {
      this.issuesLinked.emit({ messages, issues });
    });
  }

  // ==================== Sélection multiple ====================

  private keyFor(msg: MessageApp): string {
    return msg.externalMessageId ?? '';
  }

  isSelected(msg: MessageApp): boolean {
    return this.selectedMessageIds.has(this.keyFor(msg));
  }

  // Appui long sur une bulle : démarre le mode sélection avec ce message
  // pré-sélectionné. Un simple tap ne doit pas déclencher ce comportement,
  // d'où le timer annulé sur mouseup/touchend/mouseleave.
  onBubblePressStart(msg: MessageApp): void {
    if (this.selectionMode) return;
    this.longPressTriggered = false;
    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      this.longPressTriggered = true;
      this.startSelection(msg);
    }, LONG_PRESS_MS);
  }

  onBubblePressEnd(): void {
    this.clearLongPressTimer();
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  // Le click qui suit un appui long déjà traité est ignoré (sinon il
  // rouvrirait/refermerait la sélection juste créée). Hors sélection, un
  // click normal sur la bulle ne fait rien de spécial.
  onBubbleClick(msg: MessageApp, event: Event): void {
    if (this.longPressTriggered) {
      this.longPressTriggered = false;
      event.stopPropagation();
      return;
    }
    if (this.selectionMode) {
      event.stopPropagation();
      this.toggleSelect(msg);
    }
  }

  startSelection(msg: MessageApp, event?: Event): void {
    event?.stopPropagation();
    this.closeIssuePopover();
    this.selectionMode = true;
    this.selectedMessageIds.clear();
    this.selectedMessageIds.add(this.keyFor(msg));
  }

  toggleSelect(msg: MessageApp, event?: Event): void {
    event?.stopPropagation();
    const key = this.keyFor(msg);
    if (this.selectedMessageIds.has(key)) {
      this.selectedMessageIds.delete(key);
    } else {
      this.selectedMessageIds.add(key);
    }
  }

  cancelSelection(): void {
    this.selectionMode = false;
    this.selectedMessageIds.clear();
  }
}
