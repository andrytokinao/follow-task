import {
  Component, OnInit, Input, HostListener, ElementRef, ViewChild
} from '@angular/core';
import {IssueService} from "../../../../services/issue.service";
import {AuthService} from "../../../../services/auth.service";
import {UserService} from "../../../../services/user.service";
import {DocumentApp, DocumentMember, Issue, Project, Uploaded, User} from "../../../../type/issue";
import {DocumentService} from "../../../../services/document.service";
import {MatMenuTrigger} from "@angular/material/menu";
import {IssutypeForm2Component} from "../../../../common/issutype-form2/issutype-form2.component";
import {NewDocumentComponent} from "../modal/new-document/new-document.component";


@Component({
  selector: 'app-document-exchange',
  standalone: false,
  templateUrl: './document-exchange.component.html',
  styleUrl: './document-exchange.component.css'
})
export class DocumentExchangeComponent implements OnInit {

  @Input() projectId?: number;

  documents: DocumentApp[] = [];
  selectedDocument: DocumentApp | null = null;
  selectedFile: Uploaded | null = null;

  replyText: string = '';
  pendingFiles: File[] = [];

  searchKeyword: string = '';
  projSearch: string = '';
  issueSearch: string = '';

  showProjDD = false;
  showIssueDD = false;

  availableProjects: Project[] = [];
  availableIssues: Issue[] = [];
  availableUsers: User[] = [];

  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  @ViewChild('newDocumentTrigger') newDocumentTrigger!: MatMenuTrigger;
  @ViewChild('newDocumentForm') newDocumentForm!: NewDocumentComponent;

  private readonly avatarColors = [
    '#3B7DD8', '#1D9E75', '#BA7517', '#A0522D',
    '#6B5B95', '#D65C5C', '#2E8B57', '#4682B4'
  ];

  constructor(
    protected issueService: IssueService,
    private userService : UserService,
    private authService: AuthService,
    private docmentService:DocumentService,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
    this.loadProjects();
    this.loadUsers();
    this.issueService.issueMasterList$
      ?.subscribe(issues => this.availableIssues = issues);
  }

  loadDocuments(): void {
    const search = {
      projectId: this.projectId,
      keyword: this.searchKeyword || null,
      deleted: false
    };
    this.docmentService.searchDocuments(search, this.currentPage, this.pageSize)
      .subscribe(page => {
        this.documents = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
      });
  }

  loadProjects(): void {
    this.issueService.projects$.subscribe(p => this.availableProjects = p);
  }

  loadUsers(): void {
    this.userService.users$?.subscribe(u => this.availableUsers = u);
  }

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

  get pageStart(): number { return this.currentPage * this.pageSize + 1; }
  get pageEnd(): number { return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }

  selectDoc(doc: DocumentApp): void {
    this.selectedDocument = doc;
    this.replyText = '';
    if (doc.issues?.issueKey) {

    }
  }

  createDocument(): void {
    this.docmentService.createDocument(this.projectId).subscribe(doc => {
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
    this.docmentService.replyToDocument(parent.id!, reply).subscribe(resp => {
      if (!this.selectedDocument!.responses) this.selectedDocument!.responses = [];
      this.selectedDocument!.responses!.push(resp);
      this.replyText = '';
    });
  }

  selectProject(project:Project): void {
  // this.issueService.selectProject()
  }

  selectIssue(issue: Issue | null): void {
    if (!this.selectedDocument) return;
    this.selectedDocument.issues = issue ?? undefined;
    this.showIssueDD = false;
    this.docmentService.attachDocumentToIssue(
      this.selectedDocument.id!,
      issue?.id ?? null
    ).subscribe();
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

  addMember(): void {
    let userId:String
    this.docmentService.addMemberToDocument(this.selectedDocument.id,userId);
  }

  removeMember(member: DocumentMember): void {
    this.docmentService.removeMemberFromDocument(
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
    this.docmentService.addMemberToDocument(this.selectedDocument!.id!, userId)
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

  unreadCount(doc: DocumentApp): number {
    return doc.responses?.filter(r => !r.deleted).length ?? 0;
  }

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

  goPage(p: number): void { this.currentPage = p; this.loadDocuments(); }
  prevPage(): void { if (this.currentPage > 0) { this.currentPage--; this.loadDocuments(); } }
  nextPage(): void { if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.loadDocuments(); } }

  onMenNewDocumentOpened() {
    this.newDocumentForm.typeDocument = 'EXCHANGE_DOCUMENT';
    this.newDocumentForm.selectTeams = true;
  }
}
