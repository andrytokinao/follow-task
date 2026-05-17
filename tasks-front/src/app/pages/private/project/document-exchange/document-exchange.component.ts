import {
  Component, OnInit, Input, HostListener, ElementRef,
  ViewChild, AfterViewInit, NgZone, OnDestroy,
} from '@angular/core';
import { IssueService } from "../../../../services/issue.service";
import { AuthService } from "../../../../services/auth.service";
import { UserService } from "../../../../services/user.service";
import {
  DocumentApp,
  DocumentMember,
  DocumentSearch,
  DocumentUsageTypeMeta,
  Issue,
  IssueDocumentUsage,
  Project,
  Uploaded,
  User
} from "../../../../type/issue";
import { DocumentService } from "../../../../services/document.service";
import { MatMenuTrigger } from "@angular/material/menu";
import { NewDocumentComponent } from "../modal/new-document/new-document.component";

/** Breakpoint en dessous duquel on passe en mode mobile */
const MOBILE_BREAKPOINT = 768;

@Component({
  selector: 'app-document-exchange',
  standalone: false,
  templateUrl: './document-exchange.component.html',
  styleUrl: './document-exchange.component.css'
})
export class DocumentExchangeComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() projectId?: Number;

  documents: DocumentApp[] = [];
  selectedDocument: DocumentApp | null = null;
  selectedFile: Uploaded | null = null;

  usingMasterIssue: IssueDocumentUsage[] = [];
  usingIssue: IssueDocumentUsage[] = [];
  usingOtherMasterIssue: IssueDocumentUsage[] = [];
  usingOtherIssue: IssueDocumentUsage[] = [];

  replyText = '';
  pendingFiles: File[] = [];
  connectedUser: User = undefined;

  searchKeyword = '';
  projSearch = '';
  issueSearch = '';

  showProjDD = false;
  showIssueDD = false;

  availableProjects: Project[] = [];
  availableIssues: Issue[] = [];
  availableUsers: User[] = [];

  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  /** État d'ouverture de la sidebar (mobile) */
  sidebarOpen = false;

  /** true si la fenêtre est en mode mobile */
  isMobile = false;

  @ViewChild('exSidebar', { static: true }) sidebarRef!: ElementRef<HTMLElement>;
  @ViewChild('newDocumentTrigger') newDocumentTrigger!: MatMenuTrigger;
  @ViewChild('newDocumentForm') newDocumentForm!: NewDocumentComponent;
  @ViewChild('msgThread') msgThread!: ElementRef<HTMLElement>;

  search: DocumentSearch = {
    typeDocuments: ['EXCHANGE_DOCUMENT'],
    keyword: null,
    deleted: false,
  };

  private readonly avatarColors = [
    '#3B7DD8', '#1D9E75', '#BA7517', '#A0522D',
    '#6B5B95', '#D65C5C', '#2E8B57', '#4682B4'
  ];

  documentUsagetTypes: DocumentUsageTypeMeta[] = [];

  constructor(
    protected issueService: IssueService,
    private userService: UserService,
    private authService: AuthService,
    private documentService: DocumentService,
    private el: ElementRef,
    private ngZone: NgZone
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────

  ngOnInit(): void {
    this.checkMobile();
    this.loadProjects();
    this.loadUsers();

    this.issueService.issueMasterList$
      ?.subscribe(issues => this.availableIssues = issues);

    this.documentService.exchangePage$.subscribe(page => {
      this.totalElements = page.totalElements;
      this.totalPages = page.totalPages;
    });

    this.documentService.exchangeContent$.subscribe(content => {
      this.documents = content;
    });

    this.issueService.project$.subscribe(project => this.projectId = project.id);
  }

  ngAfterViewInit(): void {
    this.documentService.loadDocumentUsageTypes();
    this.documentService.documentUsageTypes$
      .subscribe(types => this.documentUsagetTypes = types);
  }

  ngOnDestroy(): void {}

  // ── Responsive ───────────────────────────────────────────────

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
    // Sur desktop, on force la sidebar ouverte (elle est dans le flux normal)
    if (!this.isMobile) {
      this.sidebarOpen = false;
    }
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  }

  /** Ouvre / ferme la sidebar en mode mobile */
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /** Ferme la sidebar (overlay click, sélection d'un doc) */
  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  /**
   * En mobile, "retour" signifie désélectionner le document
   * pour réafficher l'état vide (et rouvrir la liste).
   */
  goBack(): void {
    this.selectedDocument = null;
    if (this.isMobile) {
      this.sidebarOpen = true;
    }
  }

  // ── Données ──────────────────────────────────────────────────

  loadDocuments(): void {
    this.search.keyword = this.searchKeyword || null;
    this.documentService.loadExchange(this.search, this.currentPage, this.pageSize);
  }

  loadProjects(): void {
    this.issueService.allProjects().subscribe(p => this.availableProjects = p);
  }

  loadUsers(): void {
    this.userService.users$?.subscribe(u => this.availableUsers = u);
    this.authService.connectedUser$.subscribe(user => {
      this.connectedUser = user;
      if (this.connectedUser) {
        this.search.memberUserIds = [this.connectedUser.id];
        this.loadDocuments();
      }
    });
  }

  // ── Computed ─────────────────────────────────────────────────

  get filteredDocuments(): DocumentApp[] {
    if (!this.searchKeyword) return this.documents;
    const kw = this.searchKeyword.toLowerCase();
    return this.documents.filter(d =>
      d.titre?.toLowerCase().includes(kw) ||
      d.description?.toLowerCase().includes(kw)
    );
  }

  get filteredProjects(): Project[] {
    if (!this.projSearch) return this.availableProjects;
    const kw = this.projSearch.toLowerCase();
    return this.availableProjects.filter(p =>
      p.name?.toLowerCase().includes(kw) || p.prefix?.toLowerCase().includes(kw)
    );
  }

  get filteredIssues(): Issue[] {
    if (!this.issueSearch) return this.availableIssues;
    const kw = this.issueSearch.toLowerCase();
    return this.availableIssues.filter(i =>
      i.summary?.toLowerCase().includes(kw) || i.issueKey?.toLowerCase().includes(kw)
    );
  }

  /** Nombre total de messages non lus sur tous les documents */
  get totalUnreadCount(): number {
    return this.documents.reduce((sum, d) => sum + this.unreadCount(d), 0);
  }

  /** true si au moins un usage est associé au document sélectionné */
  get hasUsage(): boolean {
    return (
      this.usingMasterIssue.length +
      this.usingIssue.length +
      this.usingOtherMasterIssue.length +
      this.usingOtherIssue.length
    ) > 0;
  }

  get pageStart(): number { return this.currentPage * this.pageSize + 1; }
  get pageEnd(): number { return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }

  // ── Actions ──────────────────────────────────────────────────

  selectDoc(doc: DocumentApp): void {
    this.selectedDocument = undefined;

    this.documentService.loadDocumentById(doc.id).subscribe(document => {
      this.selectedDocument = document;
      this.extractUsingIssue(document.issueUsages);
      // Scroll en bas du fil après rendu
      setTimeout(() => {
        if (this.msgThread?.nativeElement) {
          this.msgThread.nativeElement.scrollTop = this.msgThread.nativeElement.scrollHeight;
        }
      }, 100);
    });

    this.replyText = '';

    if (this.connectedUser && !this.documentService.isRead(doc, this.connectedUser.id)) {
      this.documentService.markAsRead(doc.id!).subscribe(updatedDoc => {
        doc.readStatuses = updatedDoc.readStatuses;
      });
    }

    // Ferme la sidebar en mode mobile après sélection
    if (this.isMobile) {
      this.closeSidebar();
    }
  }

  isRead(doc: DocumentApp): boolean {
    return this.documentService.isRead(doc, this.connectedUser?.id);
  }

  isOwnDocument(doc: DocumentApp): boolean {
    return this.documentService.isOwnDocument(doc, this.connectedUser?.id);
  }

  unreadCount(doc: DocumentApp): number {
    return this.documentService.unreadCount(doc, this.connectedUser?.id);
  }

  createDocument(): void {
    this.documentService.createDocument(this.projectId).subscribe(doc => {
      if (doc) {
        this.documents = [doc, ...this.documents];
        this.selectDoc(doc);
      }
    });
  }

  responseDocument(parent: DocumentApp): void {
    if (!this.replyText.trim()) return;
    const reply: DocumentApp = {
      description: this.replyText,
      typeDocument: 'EXCHANGE_DOCUMENT',
      parent: { id: parent.id },
      project: parent.project
    };
    this.documentService.replyToDocument(parent.id!, reply).subscribe(resp => {
      if (!this.selectedDocument!.responses) this.selectedDocument!.responses = [];
      this.selectedDocument!.responses!.push(resp);
      this.replyText = '';
    });
  }

  addMember(): void {
    let userId: String;
    this.documentService.addMemberToDocument(this.selectedDocument.id, userId);
  }

  removeMember(member: DocumentMember): void {
    this.documentService.removeMemberFromDocument(
      this.selectedDocument!.id!,
      member.user!.id
    ).subscribe(() => {
      this.selectedDocument!.documentMembers =
        this.selectedDocument!.documentMembers?.filter(m => m.id !== member.id);
    });
  }

  onAddRecipient(event: Event): void {
    const userId = (event.target as HTMLSelectElement).value;
    if (!userId) return;
    this.documentService.addMemberToDocument(this.selectedDocument!.id!, userId)
      .subscribe(member => {
        if (!this.selectedDocument!.documentMembers) this.selectedDocument!.documentMembers = [];
        this.selectedDocument!.documentMembers!.push(member);
      });
    (event.target as HTMLSelectElement).value = '';
  }

  attachFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = () => {
      if (input.files) this.pendingFiles.push(...Array.from(input.files));
    };
    input.click();
  }

  selectFile(up: Uploaded): void {
    this.selectedFile = up;
  }

  selectProject(project: Project): void {}

  selectIssue(issue: Issue | null): void {
    if (!this.selectedDocument) return;
    this.selectedDocument.issues = issue ?? undefined;
    this.showIssueDD = false;
  }

  toggleProjDD(): void {
    this.showProjDD = !this.showProjDD;
    this.showIssueDD = false;
  }

  toggleIssueDD(): void {
    this.showIssueDD = !this.showIssueDD;
    this.showProjDD = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showProjDD = false;
      this.showIssueDD = false;
    }
  }

  onMenNewDocumentOpened(): void {
    if (this.newDocumentForm) {
      this.newDocumentForm.typeDocument = 'EXCHANGE_DOCUMENT';
    }
  }

  savedDocument(document: DocumentApp): void {
    this.newDocumentTrigger.closeMenu();
  }

  onReplySaved(doc: DocumentApp): void {
    this.documentService.loadDocumentById(doc.parent.id).subscribe(document => {
      this.selectedDocument = document;
      this.extractUsingIssue(document.issueUsages);
    });
  }

  loadUsageProject(): void {
    this.documentService.loadDocumentById(this.selectedDocument.id).subscribe(document => {
      this.selectedDocument = document;
      this.extractUsingIssue(document.issueUsages);
    });
    this.newDocumentTrigger.closeMenu();
  }

  extractUsingIssue(usingDocument: IssueDocumentUsage[]): void {
    if (!usingDocument) {
      this.usingMasterIssue = [];
      this.usingOtherMasterIssue = [];
      this.usingIssue = [];
      this.usingOtherIssue = [];
      return;
    }

    this.usingMasterIssue = usingDocument.filter(u =>
      u.issue?.parent == null && u.issue?.project?.id === this.projectId
    );
    this.usingOtherMasterIssue = usingDocument.filter(u =>
      u.issue?.parent == null && u.issue?.project?.id !== this.projectId
    );
    this.usingIssue = usingDocument.filter(u =>
      u.issue?.parent != null && u.issue?.project?.id === this.projectId
    );
    this.usingOtherIssue = usingDocument.filter(u =>
      u.issue?.parent != null && u.issue?.project?.id !== this.projectId
    );
  }

  // ── Utilitaires visuels ──────────────────────────────────────

  initials(user?: User | null): string {
    if (!user) return '?';
    const f = user.firstName?.[0] ?? '';
    const l = user.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || (user.username?.[0]?.toUpperCase() ?? '?');
  }

  avatarColor(user?: User | null): string {
    if (!user?.id) return this.avatarColors[0];
    let hash = 0;
    for (const c of user.id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return this.avatarColors[Math.abs(hash) % this.avatarColors.length];
  }

  getFileIconClass(name: string): string {
    const ext = name?.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      pdf: 'fas fa-file-pdf',
      doc: 'fas fa-file-word', docx: 'fas fa-file-word',
      xls: 'fas fa-file-excel', xlsx: 'fas fa-file-excel',
      png: 'fas fa-file-image', jpg: 'fas fa-file-image',
      jpeg: 'fas fa-file-image', gif: 'fas fa-file-image',
      zip: 'fas fa-file-archive', rar: 'fas fa-file-archive',
    };
    return map[ext ?? ''] ?? 'fas fa-file';
  }

  // ── Pagination ───────────────────────────────────────────────

  goPage(p: number): void { this.currentPage = p; this.loadDocuments(); }
  prevPage(): void { if (this.currentPage > 0) { this.currentPage--; this.loadDocuments(); } }
  nextPage(): void { if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.loadDocuments(); } }
}
