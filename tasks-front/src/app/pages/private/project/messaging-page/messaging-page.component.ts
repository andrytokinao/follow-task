import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap, takeUntil } from 'rxjs/operators';
import { MessagingService } from '../../../../services/messaging.service';
import { MessageCacheService } from '../../../../services/message-cache.service';
import {
  AttachmentDto, CanalDto, IssueMessageLink, IssueStatus, IssueTargetType,
  MessageDto, SendMessageRequest, TypeCanal,
} from '../../../../models/messaging.model';
import { getChannelConfig } from '../../../../models/canal-channel.config';
import {Issue} from "../../../../type/issue";
import {IssueService} from "../../../../services/issue.service";
import {IssueSearchCriteriaInput} from "../../../../type/issue-search-criteria.util";

// =====================================================================
// Données de test (simulent un backend "issues" — Jira-like)
// Utilisées uniquement pour les liens issue<->canal/message (mock non
// encore branché sur un vrai backend). L'autocomplétion, elle, utilise
// désormais issueService.searchIssues en temps réel.
// =====================================================================

const MOCK_ISSUES: Issue[] = [
  {
    issueKey: 'PROJ-101',
    summary: 'Corriger le bug d\'affichage des messages non lus',
    description: 'Le badge de compteur ne se réinitialise pas correctement après lecture.',
    status:{
      id:0,
      icone:{
        id:0,
        typeIcone:'',
        value:'id'
      },
      displayName:'In Progress',

    },
    completionPercent: 45,
    assigne: {
      id:'',
      username:'rasoa'

    },
  },
  {
    issueKey: 'PROJ-102',
    summary: 'Ajouter la synchronisation automatique WhatsApp',
    description: 'Mettre en place un job planifié pour synchroniser les canaux toutes les 5 minutes.',
    status:{
      id:0,
      icone:{
        id:0,
        typeIcone:'',
        value:'id'
      },
      displayName:'In Progress',

    },
    completionPercent: 80,
    assigne: {
      id:'',
      username:'rasoa'

    },
  },
  {
    issueKey: 'PROJ-103',
    summary: 'Refonte de la page messagerie (3 colonnes)',
    description: 'Nouvelle disposition avec panneau d\'informations repliable.',
    status:{
      id:0,
      icone:{
        id:0,
        typeIcone:'',
        value:'id'
      },
      displayName:'In Progress',

    },
    completionPercent: 20,
    assigne: {
      id:'',
      username:'rasoa'

    },
  },
  {
    issueKey: 'PROJ-104',
    summary: 'Export des pièces jointes en PDF',
    description: 'Permettre l\'export groupé des fichiers partagés d\'une conversation.',
    status:{
      id:0,
      icone:{
        id:0,
        typeIcone:'',
        value:'id'
      },
      displayName:'In Progress',

    },
    completionPercent: 100,
    assigne: {
      id:'',
      username:'rasoa'

    },
  },
  {
    issueKey: 'PROJ-105',
    summary: 'Notifications push en temps réel',
    description: 'Intégration WebSocket pour les nouveaux messages.',
    status:{
      id:0,
      icone:{
        id:0,
        typeIcone:'',
        value:'id'
      },
      displayName:'In Progress',

    },
    completionPercent: 5,
    assigne: {
      id:'',
      username:'rasoa'

    },
  },
  {
    issueKey: 'SUP-42',
    summary: 'Client signale une réponse tardive sur Instagram',
    status:{
      id:0,
      icone:{
        id:0,
        typeIcone:'',
        value:'id'
      },
      displayName:'In Progress',

    },
    completionPercent: 0,
    assigne: {
      id:'',
      username:'rasoa'

    },
  },
  {
    issueKey: 'SUP-58',
    summary: 'Doublon de conversation après resynchronisation',
    status:{
      id:0,
      icone:{
        id:0,
        typeIcone:'',
        value:'id'
      },
      displayName:'In Progress',

    },
    completionPercent: 60,
    assigne: {
      id:'',
      username:'rasoa'

    },
  },
];

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
  messages: MessageDto[] = [];
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
  // -------------------------------------------------------------------

  issueLinks: IssueMessageLink[] = [];
  loadingIssues = false;
  issuesError: string | null = null;
  showIssuesList = false;

  // -------------------------------------------------------------------
  // Issues liées — Messages (fil central)
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

  // Sujet RxJS pilotant la recherche temps réel (remplace l'ancien
  // setTimeout + filtre sur MOCK_ISSUES)
  private issueSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Store local simulant le backend "issue links" (targetType:targetId -> links[])
  // Reste sur mock : uniquement les liens issue<->canal/message, pas la recherche.
  private issueLinksStore = new Map<string, IssueMessageLink[]>();
  private linkIdCounter = 1000;

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
          textSearch: term
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

    this.issueLinks = [];
    this.issuesError = null;
    this.showIssuesList = false;
    this.messageIssueLinks = new Map();

    try {
      const cached = await this.cache.getMessages(canal.externalId);
      this.messages = cached;
      this.loadingMessages = cached.length === 0;
      this.rebuildMessageIssueLinks();
    } catch (err) {
      console.error('Erreur lecture cache:', err);
      this.loadingMessages = true;
    }

    let since: string | undefined;
    try {
      since = (await this.cache.getLastCachedDate(canal.externalId)) ?? undefined;
    } catch {
      since = undefined;
    }

    this.messaging.listMessages(this.channelType, canal.externalId, { since }).subscribe({
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
  // (implémentation mockée en mémoire ; à remplacer par messaging.service
  //  une fois les endpoints backend disponibles : listIssueLinks / linkIssue / unlinkIssue)
  // ---------------------------------------------------------------------

  toggleIssuesList(): void {
    this.showIssuesList = !this.showIssuesList;
    if (this.showIssuesList && this.issueLinks.length === 0 && !this.issuesError) {
      this.loadIssueLinks();
    }
  }

  loadIssueLinks(): void {
    if (!this.activeCanal) return;
    this.loadingIssues = true;
    this.issuesError = null;

    const targetId = this.activeCanal.externalId;

    // Simule un appel réseau
    setTimeout(() => {
      try {
        this.issueLinks = this.getOrSeedLinks('CANAL', targetId);
        this.loadingIssues = false;
      } catch (err) {
        console.error('Erreur loadIssueLinks:', err);
        this.issuesError = 'Impossible de charger les issues liées.';
        this.loadingIssues = false;
      }
    }, 350);
  }

  // ---------------------------------------------------------------------
  // Issues liées — Message
  // ---------------------------------------------------------------------

  onLinkIssueToMessage(message: MessageDto): void {
    this.openIssuePicker('MESSAGE', message.externalMessageId, message.text?.slice(0, 40) ?? undefined);
  }

  private rebuildMessageIssueLinks(): void {
    const map = new Map<string, IssueMessageLink[]>();
    for (const msg of this.messages) {
      const links = this.issueLinksStore.get(this.storeKey('MESSAGE', msg.externalMessageId));
      if (links?.length) map.set(msg.externalMessageId, links);
    }

    // Démo : lie automatiquement une issue fictive au premier message entrant
    // de la conversation active, pour visualiser le badge sans clic manuel.
    if (map.size === 0 && this.messages.length > 0) {
      const target = this.messages.find(m => !m.fromMe) ?? this.messages[0];
      const demoKey = this.storeKey('MESSAGE', target.externalMessageId);
      if (!this.issueLinksStore.has(demoKey)) {
        const demoIssue = MOCK_ISSUES[Math.floor(Math.random() * MOCK_ISSUES.length)];
        const demoLink: IssueMessageLink = {
          id: `${demoKey}-demo`,
          issue: demoIssue,
          targetType: 'MESSAGE',
          targetId: target.externalMessageId,
          linkedAt: new Date().toISOString(),
          linkedBy: {
            id:'er',
            username:'Vous'

          } ,
        };
        this.issueLinksStore.set(demoKey, [demoLink]);
        map.set(target.externalMessageId, [demoLink]);
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
    if (!this.issuePickerContext) return;
    const { type, targetId } = this.issuePickerContext;

    const key = this.storeKey(type, targetId);
    const existing = this.issueLinksStore.get(key) ?? [];
    if (existing.some(l => l.issue.issueKey === issue.issueKey)) {
      this.closeIssuePicker();
      return;
    }

    this.linkingIssueKey = issue.issueKey;

    setTimeout(() => {
      const newLink: IssueMessageLink = {
        id: `link-${this.linkIdCounter++}`,
        issue,
        targetType: type,
        targetId,
        linkedAt: new Date().toISOString(),
        linkedBy: {
          id:'er',
          username:'Vous'

        } ,
      };

      const links = [...existing, newLink];
      this.issueLinksStore.set(key, links);

      if (type === 'CANAL' && this.activeCanal?.externalId === targetId) {
        this.issueLinks = links;
      } else if (type === 'MESSAGE') {
        this.rebuildMessageIssueLinks();
      }

      this.linkingIssueKey = null;
      this.closeIssuePicker();
    }, 400);
  }

  unlinkIssue(link: IssueMessageLink): void {
    if (!confirm(`Retirer le lien vers l'issue ${link.issue.issueKey} ?`)) return;

    const key = this.storeKey(link.targetType, link.targetId);
    const links = (this.issueLinksStore.get(key) ?? []).filter(l => l.id !== link.id);
    this.issueLinksStore.set(key, links);

    if (link.targetType === 'CANAL' && this.activeCanal?.externalId === link.targetId) {
      this.issueLinks = links;
    } else if (link.targetType === 'MESSAGE') {
      this.rebuildMessageIssueLinks();
    }
  }

  progressClass(percent: number | null | undefined): string {
    const p = percent ?? 0;
    if (p >= 70) return 'progress-high';
    if (p >= 30) return 'progress-mid';
    return 'progress-low';
  }

  private storeKey(type: IssueTargetType, targetId: string): string {
    return `${type}:${targetId}`;
  }

  private getOrSeedLinks(type: IssueTargetType, targetId: string): IssueMessageLink[] {
    const key = this.storeKey(type, targetId);
    if (!this.issueLinksStore.has(key)) {
      // Pré-remplit avec 0 à 2 issues aléatoires pour la démo
      const count = Math.floor(Math.random() * 3);
      const shuffled = [...MOCK_ISSUES].sort(() => 0.5 - Math.random());
      const seeded: IssueMessageLink[] = shuffled.slice(0, count).map((issue, i) => ({
        id: `${key}-seed-${i}`,
        issue,
        targetType: type,
        targetId,
        linkedAt: new Date(Date.now() - i * 86400000).toISOString(),
        linkedBy: {
          id:'er',
          username:'Vous'

        } ,
      }));
      this.issueLinksStore.set(key, seeded);
    }
    return this.issueLinksStore.get(key)!;
  }
}
