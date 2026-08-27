import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap, takeUntil } from 'rxjs/operators';
import { MessagingService } from '../../../../services/messaging.service';
import { MessageCacheService } from '../../../../services/message-cache.service';
import {
  AttachmentDto, CanalDto, IssueCanalLink, IssueMessageLink, IssueTargetType,
  MessageDto, SendMessageRequest, TypeCanal,
} from '../../../../models/messaging.model';
import { getChannelConfig } from '../../../../models/canal-channel.config';
import {Issue, MessageApp, Project} from "../../../../type/issue";
import {IssueService} from "../../../../services/issue.service";
import {IssueSearchCriteriaInput} from "../../../../type/issue-search-criteria.util";

@Component({
  selector: 'app-messaging-page',
  standalone: false,
  templateUrl: './messaging-page.component.html',
  styleUrls: ['./messaging-page.component.scss'],
})
export class MessagingPageComponent implements OnInit, OnDestroy {

  channelType: TypeCanal = TypeCanal.WHATSAPP;

  canaux: CanalDto[] = [];
  filteredCanaux: CanalDto[] = [];
  searchTerm = '';
  loadingList = true;
  listError: string | null = null;

  activeCanal: CanalDto | null = null;
  messages: MessageApp[] = [];
  loadingMessages = false;
  messagesError: string | null = null;
  draftText = '';
  sending = false;

  // Détail canal (colonne droite)
  canalDetail: CanalDto | null = null;
  loadingDetail = false;
  showInfoPanel = true;

  showMembersList = false;

  attachments: AttachmentDto[] = [];
  loadingAttachments = false;
  attachmentsError: string | null = null;
  showAttachmentsList = false;

  // -------------------------------------------------------------------
  // Issues liées — Canal (colonne droite)
  // Alimenté directement par activeCanal.issueLinks (déjà renvoyé par
  // LIST_CANAUX), aucune requête séparée nécessaire.
  // -------------------------------------------------------------------

  issueLinks: IssueCanalLink[] = [];
  showIssuesList = false;
  linkingIssue = false;

  // -------------------------------------------------------------------
  // Issues liées — Messages (fil central)
  // Alimenté directement par message.messageLinks (déjà renvoyé par
  // LIST_MESSAGES), aucune requête séparée nécessaire.
  // -------------------------------------------------------------------

  messageIssueLinks: Map<string, IssueMessageLink[]> = new Map();

  // -------------------------------------------------------------------
  // Sélecteur d'issue (modal, réutilisé canal + message)
  // -------------------------------------------------------------------

  showIssuePicker = false;
  issuePickerContext: { type: IssueTargetType; targetId: string; label?: string } | null = null;
  issueSearchTerm = '';
  issueSearchResults: Issue[] = [];
  searchingIssues = false;
  linkingIssueKey: String | null = null;

  // Sujet RxJS pilotant la recherche temps réel
  private issueSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private project: Project;

  constructor(
    private messaging: MessagingService,
    private cache: MessageCacheService,
    private issueService: IssueService
  ) {
    this.issueSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(term => {
        this.searchingIssues = !!term;
        if (!term) {
          this.issueSearchResults = [];
        }
      }),
      switchMap(term => {
        if (!term) {
          return of<Issue[]>([]);
        }
        const criteria: IssueSearchCriteriaInput = {
          textSearch: term,
          projectId:this.project.id
        };
        return this.issueService.searchIssues(criteria, null as any).pipe(
          catchError(err => {
            console.error('Erreur searchIssues:', err);
            return of<Issue[]>([]);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.issueSearchResults = results;
      this.searchingIssues = false;
    });
    this.issueService.project$.subscribe(p=> {
      this.project = p;
    })
  }

  ngOnInit(): void {
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------------------------------------------------------------------
  // Colonne gauche : liste + filtre
  // ---------------------------------------------------------------------

  loadConversations(): void {
    this.loadingList = true;
    this.listError = null;

    this.messaging.listCanaux(this.channelType).subscribe({
      next: (list) => {
        this.canaux = [...list].sort((a, b) =>
          new Date(b.lastMessage?.createdAt ?? 0).getTime() -
          new Date(a.lastMessage?.createdAt ?? 0).getTime()
        );
        this.applyFilter();
        this.loadingList = false;

        // Garde la conversation active synchronisée avec la nouvelle référence
        // de la liste (issueLinks à jour) si elle est toujours ouverte.
        if (this.activeCanal) {
          const refreshed = this.canaux.find(c => c.externalId === this.activeCanal!.externalId);
          if (refreshed) {
            this.activeCanal = refreshed;
            this.issueLinks = refreshed.issueLinks ?? [];
          }
        }
      },
      error: (err) => {
        console.error('Erreur listCanaux:', err);
        this.listError = 'Impossible de charger les conversations.';
        this.loadingList = false;
      },
    });
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredCanaux = !term
      ? this.canaux
      : this.canaux.filter(c => c.pseudo?.toLowerCase().includes(term));
  }

  trackByExternalId(_i: number, canal: CanalDto): string {
    return canal.externalId;
  }

  channelIcon(canal: CanalDto): string {
    return getChannelConfig(canal.typeCanal).icon;
  }

  channelColor(canal: CanalDto): string {
    return getChannelConfig(canal.typeCanal).color;
  }

  previewText(canal: CanalDto): string {
    const msg = canal.lastMessage;
    if (!msg) return 'Aucun message';
    if (msg.text) return msg.fromMe ? `Vous: ${msg.text}` : msg.text;
    if (msg.hasAttachment) return msg.fromMe ? 'Vous: 📎 Pièce jointe' : '📎 Pièce jointe';
    return '...';
  }

  // ---------------------------------------------------------------------
  // Colonne centrale : ouverture d'une conversation
  // ---------------------------------------------------------------------

  async openConversation(canal: CanalDto): Promise<void> {
    this.activeCanal = canal;
    this.messages = [];
    this.canalDetail = null;
    this.messagesError = null;

    // Repli systématique des sections dépliables à chaque nouvelle conversation
    this.showMembersList = false;
    this.attachments = [];
    this.attachmentsError = null;
    this.showAttachmentsList = false;

    this.issueLinks = canal.issueLinks ?? [];
    this.showIssuesList = false;
    this.messageIssueLinks = new Map();

    try {
      const cached = await this.cache.getMessages(canal.externalId);
      // this.messages = cached;
      this.loadingMessages = cached.length === 0;
      this.rebuildMessageIssueLinks();
    } catch (err) {
      console.error('Erreur lecture cache:', err);
      this.loadingMessages = true;
    }

    let since: string | undefined;
    try {
    //  since = (await this.cache.getLastCachedDate(canal.externalId)) ?? undefined;
    } catch {
      since = undefined;
    }

    this.messaging.listMessagesEntity(this.channelType, canal.externalId, { since }).subscribe({
      next: async (fresh) => {
        try {
          await this.cache.saveMessages(fresh);
          this.messages = await this.cache.getMessages(canal.externalId);
        } catch (err) {
          console.error('Erreur écriture cache:', err);
          this.messages = fresh;
        }
        this.loadingMessages = false;
        canal.unreadCount = 0;
        this.rebuildMessageIssueLinks();
      },
      error: (err) => {
        console.error('Erreur listMessages:', err);
        this.messagesError = 'Impossible de charger les messages.';
        this.loadingMessages = false;
      },
    });

    this.loadCanalDetail(canal.externalId);
  }

  loadCanalDetail(externalId: string): void {
    this.loadingDetail = true;
    this.messaging.getCanal(this.channelType, externalId).subscribe({
      next: (detail) => {
        this.canalDetail = detail;
        this.loadingDetail = false;
      },
      error: (err) => {
        console.error('Erreur getCanal:', err);
        this.loadingDetail = false;
      },
    });
  }

  sendMessage(): void {
    const text = this.draftText.trim();
    if (!text || !this.activeCanal || this.sending) return;

    this.sending = true;
    const request: SendMessageRequest = { text };

    this.messaging.sendMessage(this.channelType, this.activeCanal.externalId, request).subscribe({
      next: async (sent) => {
        try {
          await this.cache.saveMessages([sent]);
          this.messages = await this.cache.getMessages(this.activeCanal!.externalId);
        } catch {
          this.messages = [...this.messages, sent];
        }
        this.draftText = '';
        this.sending = false;
        this.rebuildMessageIssueLinks();
      },
      error: (err) => {
        console.error('Erreur sendMessage:', err);
        this.sending = false;
      },
    });
  }

  // ---------------------------------------------------------------------
  // Colonne droite : panneau, membres, fichiers
  // ---------------------------------------------------------------------

  toggleInfoPanel(): void {
    this.showInfoPanel = !this.showInfoPanel;
  }

  toggleMembersList(): void {
    this.showMembersList = !this.showMembersList;
  }

  toggleAttachmentsList(): void {
    this.showAttachmentsList = !this.showAttachmentsList;
    if (this.showAttachmentsList && this.attachments.length === 0 && !this.attachmentsError) {
      this.loadAttachments();
    }
  }

  loadAttachments(): void {
    if (!this.activeCanal) return;
    this.loadingAttachments = true;
    this.attachmentsError = null;

    this.messaging.listAttachments(this.channelType, this.activeCanal.externalId).subscribe({
      next: (list) => {
        this.attachments = list;
        this.loadingAttachments = false;
      },
      error: (err) => {
        console.error('Erreur listAttachments:', err);
        this.attachmentsError = 'Impossible de charger les fichiers.';
        this.loadingAttachments = false;
      },
    });
  }

  formatSize(bytes: number | null | undefined): string {
    if (!bytes) return '';
    return (bytes / 1024 / 1024).toFixed(1) + ' Mo';
  }

  attachmentIconClass(att: AttachmentDto): Record<string, boolean> {
    return {
      'fa-file-image': att.mediaType === 'IMAGE',
      'fa-file-video': att.mediaType === 'VIDEO',
      'fa-file-audio': att.mediaType === 'AUDIO',
      'fa-file-lines': att.mediaType === 'DOCUMENT' || !att.mediaType,
    };
  }

  syncActiveCanal(): void {
    this.messaging.syncCanal(this.channelType).subscribe({
      next: () => {
        this.loadConversations();
        if (this.activeCanal) this.openConversation(this.activeCanal);
      },
      error: (err) => console.error('Erreur syncCanal:', err),
    });
  }

  // ---------------------------------------------------------------------
  // Issues liées — Canal
  // Les données sont déjà présentes sur activeCanal.issueLinks (renvoyées
  // par LIST_CANAUX) : pas besoin de requête réseau supplémentaire.
  // ---------------------------------------------------------------------

  toggleIssuesList(): void {
    this.showIssuesList = !this.showIssuesList;
  }

  // ---------------------------------------------------------------------
  // Issues liées — Message
  // ---------------------------------------------------------------------

  onLinkIssueToMessage(message: MessageApp): void {
    this.openIssuePicker('MESSAGE', message.externalMessageId, message.text?.slice(0, 40) ?? undefined);
  }

  private rebuildMessageIssueLinks(): void {
    const map = new Map<string, IssueMessageLink[]>();
    for (const msg of this.messages) {
      if (msg.messageLinks?.length) {
        map.set(msg.externalMessageId, msg.messageLinks);
      }
    }
    this.messageIssueLinks = map;
  }

  // ---------------------------------------------------------------------
  // Sélecteur d'issue (modal partagée)
  // ---------------------------------------------------------------------

  openIssuePicker(type: IssueTargetType, targetId: string, label?: string): void {
    this.issuePickerContext = { type, targetId, label };
    this.issueSearchTerm = '';
    this.issueSearchResults = [];
    this.showIssuePicker = true;
  }

  closeIssuePicker(): void {
    this.showIssuePicker = false;
    this.issuePickerContext = null;
    this.issueSearchTerm = '';
    this.issueSearchResults = [];
  }

  onIssueSearchChange(): void {
    const term = this.issueSearchTerm.trim();
    this.issueSearch$.next(term);
  }

  confirmLinkIssue(issue: Issue): void {
    if (!this.issuePickerContext || this.linkingIssue) return;
    const { type, targetId } = this.issuePickerContext;

    if (type === 'CANAL') {
      if (this.issueLinks.some(l => l.issue.issueKey === issue.issueKey)) {
        this.closeIssuePicker();
        return;
      }
    } else {
      const existing = this.messageIssueLinks.get(targetId) ?? [];
      if (existing.some(l => l.issue.issueKey === issue.issueKey)) {
        this.closeIssuePicker();
        return;
      }
    }

    this.linkingIssueKey = issue.issueKey;
    this.linkingIssue = true;

    const onError = (err: any) => {
      console.error('Erreur linkIssue:', err);
      this.linkingIssueKey = null;
      this.linkingIssue = false;
    };

    if (type === 'CANAL') {
      this.messaging.linkIssueToCanal(issue.id!, targetId).subscribe({
        next: (link) => {
          this.issueLinks = [...this.issueLinks, link];
          if (this.activeCanal) {
            this.activeCanal.issueLinks = this.issueLinks;
          }
          this.linkingIssueKey = null;
          this.linkingIssue = false;
          this.closeIssuePicker();
        },
        error: onError,
      });
    } else {
      this.messaging.linkIssueToMessage(issue.id!, targetId).subscribe({
        next: (link) => {
          const message = this.messages.find(m => m.externalMessageId === targetId);
          if (message) {
            message.messageLinks = [...(message.messageLinks ?? []), link];
          }
          this.rebuildMessageIssueLinks();
          this.linkingIssueKey = null;
          this.linkingIssue = false;
          this.closeIssuePicker();
        },
        error: onError,
      });
    }
  }

  unlinkCanalLink(link: IssueCanalLink): void {
    if (!confirm(`Retirer le lien vers l'issue ${link.issue.issueKey} ?`)) return;

    this.messaging.unlinkIssueFromCanal(link.id).subscribe({
      next: (ok) => {
        if (!ok) return;
        this.issueLinks = this.issueLinks.filter(l => l.id !== link.id);
        if (this.activeCanal) {
          this.activeCanal.issueLinks = this.issueLinks;
        }
      },
      error: (err) => console.error('Erreur unlinkIssueFromCanal:', err),
    });
  }

  unlinkMessageLink(link: IssueMessageLink): void {
    if (!confirm(`Retirer le lien vers l'issue ${link.issue.issueKey} ?`)) return;

    this.messaging.unlinkIssueFromMessage(link.id).subscribe({
      next: (ok) => {
        if (!ok) return;
        this.rebuildMessageIssueLinks();
      },
      error: (err) => console.error('Erreur unlinkIssueFromMessage:', err),
    });
  }

  progressClass(percent: number | null | undefined): string {
    const p = percent ?? 0;
    if (p >= 70) return 'progress-high';
    if (p >= 30) return 'progress-mid';
    return 'progress-low';
  }
}
