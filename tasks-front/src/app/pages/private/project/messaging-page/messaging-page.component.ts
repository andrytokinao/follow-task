import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, of, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap, takeUntil, map, take } from 'rxjs/operators';
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

  // -------------------------------------------------------------------
  // Filtre par type de canal
  // -------------------------------------------------------------------
  //
  // `listCanaux(type)` est filtré par le backend et n'accepte QU'UN type à la
  // fois. Chaque pastille déclenche donc une vraie requête, et non un filtre
  // local. Jusqu'ici `channelType` était figé sur WHATSAPP : les canaux des
  // autres fournisseurs étaient inatteignables depuis cette page.
  //
  // Seuls les types de messagerie externe sont proposés : PROJECT, ISSUE et
  // DEFAULT sont des natures de canal internes (tasks.graphqls), pas des
  // fournisseurs.
  readonly channelFilters: TypeCanal[] = [
    TypeCanal.WHATSAPP,
    TypeCanal.FACEBOOK,
    TypeCanal.TELEGRAM,
    TypeCanal.INSTAGRAM,
    TypeCanal.SLACK,
    TypeCanal.SMS,
    TypeCanal.EMAIL,
  ];

  channelType: TypeCanal = TypeCanal.WHATSAPP;

  // « Tous » n'existe pas côté API : il faut interroger chaque type puis
  // fusionner. Volontairement pas la sélection par défaut, pour ne pas lancer
  // sept requêtes à l'ouverture de la page.
  allChannels = false;

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

  // -------------------------------------------------------------------
  // Disposition : repli des colonnes latérales
  // -------------------------------------------------------------------

  // Colonne gauche repliée : seules les photos des canaux restent visibles.
  listCollapsed = false;

  // Même point de rupture que la feuille de style : les deux doivent basculer
  // ensemble, sinon l'état JS et la mise en page se contredisent.
  private static readonly MOBILE_QUERY = '(max-width: 860px)';
  private mobileQuery?: MediaQueryList;
  private onMobileChange = (event: MediaQueryListEvent) => this.applyLayoutFor(event.matches);
  isMobile = false;

  // Sur mobile : la liste est toujours réduite au rail d'avatars, et le
  // panneau de détail devient un tiroir, fermé par défaut.
  private applyLayoutFor(isMobile: boolean): void {
    this.isMobile = isMobile;
    if (isMobile) {
      this.listCollapsed = true;
      this.showInfoPanel = false;
    } else {
      this.listCollapsed = false;
    }
  }

  toggleList(): void {
    this.listCollapsed = !this.listCollapsed;
  }

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

  // Arborescence des issues (masters + sous-issues) alimentant
  // app-issue-picker-menu, le même sélecteur que celui du fil de messages.
  masters: Issue[] = [];

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
    this.issueService.issueMasterList$
      .pipe(takeUntil(this.destroy$))
      .subscribe(masters => {
        this.masters = masters;
      });
  }

  ngOnInit(): void {
    this.mobileQuery = window.matchMedia(MessagingPageComponent.MOBILE_QUERY);
    this.applyLayoutFor(this.mobileQuery.matches);
    this.mobileQuery.addEventListener('change', this.onMobileChange);

    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.mobileQuery?.removeEventListener('change', this.onMobileChange);
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------------------------------------------------------------------
  // Colonne gauche : liste + filtre
  // ---------------------------------------------------------------------

  // ---------------------------------------------------------------------
  // Sélection du type de canal
  // ---------------------------------------------------------------------

  // Type à utiliser pour les appels portant sur la conversation ouverte
  // (messages, détail, envoi, pièces jointes, synchro). En mode « Tous » la
  // liste mélange les fournisseurs : c'est le canal lui-même qui fait foi,
  // pas le filtre sélectionné.
  private get activeType(): TypeCanal {
    return this.activeCanal?.typeCanal ?? this.channelType;
  }

  isChannelFilterActive(type: TypeCanal): boolean {
    return !this.allChannels && this.channelType === type;
  }

  selectChannelType(type: TypeCanal): void {
    if (this.isChannelFilterActive(type)) return;
    this.allChannels = false;
    this.channelType = type;
    this.resetForChannelChange();
    this.loadConversations();
  }

  selectAllChannels(): void {
    if (this.allChannels) return;
    this.allChannels = true;
    this.resetForChannelChange();
    this.loadConversations();
  }

  // La conversation ouverte appartient au type qu'on quitte : la garder
  // afficherait un fil qui n'est plus dans la liste.
  private resetForChannelChange(): void {
    this.activeCanal = null;
    this.messages = [];
    this.canalDetail = null;
    this.issueLinks = [];
    this.messageIssueLinks = new Map();
  }

  filterIconClass(type: TypeCanal): string {
    return getChannelConfig(type).iconClass;
  }

  filterLabel(type: TypeCanal): string {
    return getChannelConfig(type).label;
  }

  filterColor(type: TypeCanal): string {
    return getChannelConfig(type).color;
  }

  loadConversations(): void {
    this.loadingList = true;
    this.listError = null;

    // Un type = une requête ; « Tous » = une requête par type, fusionnées.
    const source$ = this.allChannels
      ? forkJoin(
          this.channelFilters.map(type =>
            this.messaging.listCanaux(type).pipe(
              take(1),
              // Un fournisseur non configuré ne doit pas faire échouer
              // l'ensemble : on renvoie une liste vide pour ce type.
              catchError(() => of<CanalDto[]>([])),
            )
          )
        ).pipe(map(lists => lists.flat()))
      : this.messaging.listCanaux(this.channelType);

    source$.subscribe({
      next: (list) => {
        this.canaux = [...list].sort((a, b) =>
          new Date(b.lastMessage?.createdAt ?? 0).getTime() -
          new Date(a.lastMessage?.createdAt ?? 0).getTime()
        );
        this.applyFilter();
        this.loadingList = false;

        // Garde la conversation active synchronisée avec la nouvelle référence
        // de la liste si elle est toujours ouverte. Les issues liées ne sont
        // pas touchées ici : elles viennent de getCanal, pas de listCanaux.
        if (this.activeCanal) {
          const refreshed = this.canaux.find(c => c.externalId === this.activeCanal!.externalId);
          if (refreshed) {
            this.activeCanal = refreshed;
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

  channelIconClass(canal: CanalDto): string {
    return getChannelConfig(canal.typeCanal).iconClass;
  }

  channelLabel(canal: CanalDto): string {
    return getChannelConfig(canal.typeCanal).label;
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
  async reLoadMessageList(isReload: boolean) {
    if (!isReload) {
      this.canalDetail = null;
      this.messagesError = null;
      this.messages = [];

      // Repli systématique des sections dépliables, uniquement à l'ouverture
      // d'une NOUVELLE conversation — pas lors d'un simple rafraîchissement.
      this.showMembersList = false;
      this.attachments = [];
      this.attachmentsError = null;
      this.showAttachmentsList = false;
      this.showIssuesList = false;

      // Les issues liées arrivent avec le détail du canal (getCanal), chargé
      // plus bas : on vide en attendant plutôt que d'afficher celles du canal
      // précédent. En reload, loadCanalDetail n'est pas rappelé -> on garde
      // la liste déjà chargée.
      this.issueLinks = [];
    }

    this.messageIssueLinks = new Map();

    try {
      const cached = await this.cache.getMessages(this.activeCanal.externalId);
      // En reload, on garde les messages déjà affichés le temps que le
      // réseau réponde, au lieu de repasser par un état "loading" qui
      // vide visuellement le fil.
      this.loadingMessages = !isReload && cached.length === 0;
      this.rebuildMessageIssueLinks();
    } catch (err) {
      console.error('Erreur lecture cache:', err);
      this.loadingMessages = !isReload;
    }

    let since: string | undefined;
    try {
      //  since = (await this.cache.getLastCachedDate(canal.externalId)) ?? undefined;
    } catch {
      since = undefined;
    }

    this.messaging.listMessagesEntity(this.activeCanal.typeCanal, this.activeCanal.externalId, { since }).subscribe({
      next: async (fresh) => {
        this.messages = fresh;
        this.loadingMessages = false;
        this.activeCanal.unreadCount = 0;
        this.rebuildMessageIssueLinks();
      },
      error: (err) => {
        console.error('Erreur listMessages:', err);
        this.messagesError = 'Impossible de charger les messages.';
        this.loadingMessages = false;
      },
    });

    // Le détail du canal (membres, description...) ne change pas quand on
    // ne fait que rafraîchir les messages d'une conversation déjà ouverte.
    if (!isReload) {
      this.loadCanalDetail(this.activeCanal.externalId);
    }
  }
  async openConversation(canal: CanalDto): Promise<void> {
    const isReload = this.activeCanal?.externalId === canal.externalId;
    this.activeCanal = canal;

    await this.reLoadMessageList(isReload);
  }

  loadCanalDetail(externalId: string): void {
    this.loadingDetail = true;
    this.messaging.getCanal(this.activeType, externalId).subscribe({
      next: (detail) => {
        this.canalDetail = detail;
        // getCanal est la seule source des liens issue<->canal : listCanaux ne
        // les remonte pas (une requête par canal pour une donnée affichée
        // seulement ici).
        this.issueLinks = detail?.issueLinks ?? [];
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

    this.messaging.sendMessage(this.activeType, this.activeCanal.externalId, request).subscribe({
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

  closeInfoPanel(): void {
    this.showInfoPanel = false;
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

    this.messaging.listAttachments(this.activeType, this.activeCanal.externalId).subscribe({
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
    this.messaging.syncCanal(this.activeType).subscribe({
      next: () => {
        this.loadConversations();
        if (this.activeCanal) this.openConversation(this.activeCanal);
      },
      error: (err) => console.error('Erreur syncCanal:', err),
    });
  }

  // ---------------------------------------------------------------------
  // Issues liées — Canal
  // Chargées avec le détail du canal (getCanal), qui ne renvoie que les
  // liens actifs : un lien retiré est clôturé côté back (endedAt), pas
  // supprimé, et ne doit donc pas réapparaître au rechargement.
  // ---------------------------------------------------------------------

  toggleIssuesList(): void {
    this.showIssuesList = !this.showIssuesList;
  }

  // Validation de app-issue-picker-menu : une ou plusieurs issues cochées sont
  // liées au canal ouvert en un seul appel. Les issues déjà liées sont écartées
  // ici pour ne pas envoyer d'ids inutiles (le back est de toute façon
  // idempotent : il renvoie le lien actif existant).
  onIssuesPickedForCanal(issues: Issue[]): void {
    if (!this.activeCanal || !issues.length || this.linkingIssue) return;

    const linkedIssueIds = new Set(this.issueLinks.map(l => l.issue?.id));
    const toLink = issues.filter(i => i.id != null && !linkedIssueIds.has(i.id));
    if (!toLink.length) return;

    // La conversation peut changer pendant la requête : on retient le canal
    // visé pour ne pas coller les liens sur le canal ouvert entre-temps.
    const targetCanalId = this.activeCanal.externalId;
    this.linkingIssue = true;

    this.messaging.linkIssuesToCanal(toLink.map(i => i.id!), targetCanalId).subscribe({
      next: (links) => {
        this.linkingIssue = false;
        if (this.activeCanal?.externalId !== targetCanalId) return;

        const byId = new Map<number, IssueCanalLink>(this.issueLinks.map(l => [l.id, l]));
        for (const link of links) {
          byId.set(link.id, link);
        }
        this.issueLinks = Array.from(byId.values());
        this.syncDetailIssueLinks();
        this.showIssuesList = true;
      },
      error: (err) => {
        console.error('Erreur linkIssuesToCanal:', err);
        this.linkingIssue = false;
      },
    });
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
          this.syncDetailIssueLinks();
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
        this.syncDetailIssueLinks();
      },
      error: (err) => console.error('Erreur unlinkIssueFromCanal:', err),
    });
  }

  // Le détail du canal n'est rechargé qu'à l'ouverture d'une conversation :
  // on y reporte les liaisons créées/retirées entre-temps pour qu'un simple
  // reload des messages ne réaffiche pas une liste périmée.
  private syncDetailIssueLinks(): void {
    if (this.canalDetail) {
      this.canalDetail.issueLinks = this.issueLinks;
    }
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

  // URL de consultation de l'issue liée, ou null si elle n'appartient pas au
  // projet courant (la construction est centralisée dans IssueService).
  issueUrl(link: IssueCanalLink): string | null {
    return this.issueService.getIssueUrl(link.issue);
  }

  // Durée courte : "2h30", "3h", "45min".
  formatDuration(minutes: number | null | undefined): string {
    if (!minutes || minutes <= 0) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h${m.toString().padStart(2, '0')}`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  }

  progressClass(percent: number | null | undefined): string {
    const p = percent ?? 0;
    if (p >= 70) return 'progress-high';
    if (p >= 30) return 'progress-mid';
    return 'progress-low';
  }

}
