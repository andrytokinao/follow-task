import {
  Component, EventEmitter, HostBinding,
  Input, Output
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentApp, Issue, Project, Uploading, User } from '../../../../../type/issue';
import { AuthService } from '../../../../../services/auth.service';
import { ConfigService } from '../../../../../services/config.service';
import { DocumentService } from '../../../../../services/document.service';
import { IssueService } from '../../../../../services/issue.service';
import { UserService } from '../../../../../services/user.service';

@Component({
  standalone: false,
  selector: 'app-new-document',
  templateUrl: './new-document.component.html',
  styleUrl: './new-document.component.css'
})
export class NewDocumentComponent {

  /* ── Inputs ── */
  @Input() mode: 'create' | 'reply' | 'comment' = 'create';
  @Input() selectedProject: Project | undefined = undefined;

  @Input()
  @HostBinding('class.nd-standalone')
  standalone: boolean = false;

  @Input() set parentDocument(doc: DocumentApp) {
    this._parentDocument = doc;
    this.reset();
  }
  get parentDocument(): DocumentApp { return this._parentDocument; }

  /* ── Outputs ── */
  @Output() onSave  = new EventEmitter<DocumentApp>();
  @Output() onClose = new EventEmitter<void>();

  /* ── Stepper (create uniquement) ── */
  steps = [
    { label: 'Équipe',  desc: 'Département'              },
    { label: 'Membres', desc: 'Destinataires'             },
    { label: 'Demande', desc: 'Sujet · Contenu · Fichiers'},
  ];
  subtitles = [
    'Sélectionnez le département concerné',
    'Ajoutez les destinataires de la demande',
    'Rédigez votre sujet, contenu et fichiers',
  ];
  hints = ['Étape 1 sur 3', 'Étape 2 sur 3', 'Étape 3 sur 3'];
  currentStep = 0;

  /* ── Recherche ── */
  teamSearch   = '';
  memberSearch = '';

  /* ── État ── */
  uploadings: Uploading[] = [];
  newDocument: DocumentApp = {};
  selectedUsers: string[] = [];
  filesToUploads: any;

  typeDocument: 'ISSUE_FILES' | 'COMMENT_FILES' | 'MEDIA_FILES' |
    'SOURCE_FILE' | 'DONNE_FILE'   | 'MESSEGE_FILES' |
    'WIKI_FILES'  | 'EXCHANGE_DOCUMENT' | 'RESPONSE_DOCUMENT'
    = 'ISSUE_FILES';

  protected user: User;

  private _parentDocument: DocumentApp;
  private uploadingDoc: any;
  private allUsers: User[] = [];
  private issue: Issue;
  private project: Project;

  protected userToSelect: User[] = [];

  projects: Project[] = [];
  filteredProjectsList: Project[] = [];

  /* ── Getters filtrés ── */
  get filteredProjects(): Project[] {
    const q = this.teamSearch.toLowerCase();
    return this.projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.prefix.toLowerCase().includes(q)
    );
  }

  get filteredUsers(): User[] {
    const q = this.memberSearch.toLowerCase();
    return this.userToSelect.filter(u =>
      u.username?.toLowerCase().includes(q)
    );
  }

  /* ── Constructor ── */
  constructor(
    private router: Router,
    private modalService: NgbModal,
    private configService: ConfigService,
    protected issueService: IssueService,
    private userService: UserService,
    private route: ActivatedRoute,
    private authService: AuthService,
    public activeModal: NgbActiveModal,
    private documentService: DocumentService
  ) {
    this.userService.users$.subscribe(users => {
      this.allUsers = users;
      this.syncUserToSelect();
    });

    this.authService.connectedUser$.subscribe(user => {
      this.user = user;
      this.syncUserToSelect();
    });

    this.issueService.project$.subscribe(project => {
      this.project = project;
    });

    this.issueService.allProject$.subscribe(prs => {
      this.projects = prs;
    });
  }

  /* ── Stepper ── */
  goTo(i: number)  { this.currentStep = i; }
  nextStep()       { if (this.isStepValid()) this.currentStep++; }
  prevStep()       { if (this.currentStep > 0) this.currentStep--; }

  isStepValid(): boolean {
    if (this.currentStep === 0) return !!this.newDocument.project;
    if (this.currentStep === 1) return this.selectedUsers.length > 0;
    return !!(this.newDocument.description || this.uploadings.length > 0);
  }

  /* ── Membres ── */
  syncUserToSelect() {
    this.userToSelect = this.user?.id
      ? [...this.allUsers].filter(u => u.id !== this.user.id)
      : [...this.allUsers];
  }

  isSelectedUser(id: string): boolean {
    return this.selectedUsers.some(u => u === id);
  }

  toggleUserById(id: string) {
    this.selectedUsers = this.isSelectedUser(id)
      ? this.selectedUsers.filter(x => x !== id)
      : [...this.selectedUsers, id];
  }

  selectUser(event: any, user: User) {
    const checked = event.target.checked;
    if (checked) {
      if (!this.selectedUsers) this.selectedUsers = [];
      this.selectedUsers.push(user.id);
    } else {
      this.selectedUsers = this.selectedUsers.filter(cf => cf !== user.id);
    }
  }

  getUserName(id: string): string {
    return this.userToSelect.find(u => u.id === id)?.username?.split(' ')[0] || '';
  }

  /* ── Projet ── */
  selectProject(p: Project) {
    this.newDocument.project = { id: p.id };
    this.selectedUsers = [];
    this.loadPriorityDestination(p.prefix);
  }

  loadPriorityDestination(projectPrefix: String) {
    this.userService.getUserForProjectAndRole(
      projectPrefix, ['ADMIN', 'PROJECT_MANAGER']
    ).subscribe(users => {
      this.userToSelect = users;
    });
  }

  /* ── Fichiers ── */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.filesToUploads = event.dataTransfer.files;
      for (let i = 0; i < event.dataTransfer.files.length; i++) {
        const uploading: Uploading = {
          file: event.dataTransfer.files.item(i)!,
          progression: 0,
          status: ''
        } as any;
        this.uploadings.push(uploading);
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.filesToUploads = input.files;
      for (let i = 0; i < input.files.length; i++) {
        const uploading: Uploading = {
          file: input.files.item(i)!,
          progression: 0,
          status: ''
        } as any;
        this.uploadings.push(uploading);
      }
    }
  }

  removeFile(index: number) {
    this.uploadings.splice(index, 1);
  }

  /* ── Validation globale ── */
  isFormValid(): boolean {
    if (this.mode === 'reply' || this.mode === 'comment') {
      return !!(this.newDocument.description || this.uploadings.length > 0);
    }
    if (!this.selectedUsers || this.selectedUsers.length === 0) return false;
    return !!(
      this.newDocument.project &&
      (this.newDocument.description || this.uploadings.length > 0)
    );
  }

  /* ── Sauvegarde ── */
  saveDocument() {
    if (this.parentDocument) {
      this.newDocument.parent = { id: this.parentDocument.id };
      this.newDocument.titre  = 'Re:' + this.parentDocument.titre;
    }

    if (this.newDocument.id) {
      this.issueService.uploadDocument(
        this.newDocument, this.issue?.encodedPath,
        this.uploadings, this.typeDocument
      ).subscribe(document => {
        if (!this.uploadings || this.uploadings.length === 0) {
          this.documentService.forwardDocument(document);
          this.activeModal.close(document);
          this.reset();
        }
      });
      return;
    }

    if (this.typeDocument) this.newDocument.typeDocument = this.typeDocument;
    if (this.issue)        this.newDocument.issues   = { id: this.issue.id };
    if (this.user && !this.newDocument.userApp) {
      this.newDocument.userApp = { id: this.user.id };
    }
    if (this.selectedUsers?.length > 0) {
      const userIds = [...this.selectedUsers, this.user.id];
      this.newDocument.members = userIds;
    }

    this.issueService.uploadDocument(
      this.newDocument, this.issue?.encodedPath,
      this.uploadings, this.typeDocument
    ).subscribe(document => {
      if (!this.uploadings || this.uploadings.length === 0) {
        this.documentService.forwardDocument(document);
        this.activeModal.close(document);
        this.onSave.emit(document);
        this.reset();
      }
    });

    if (!this.issueService.uploadingDocumentSubject) {
      this.issueService.uploadingDocumentSubject =
        new BehaviorSubject<DocumentApp>(this.newDocument);
    }

    this.uploadingDoc = this.issueService.uploadingDocumentSubject.asObservable();
    this.uploadingDoc.subscribe((doc: DocumentApp) => {
      if (doc.id) {
        this.issueService.uploadingDocumentSubject.complete();
        this.uploadings = [];
        this.documentService.loadDocumentById(doc.id).subscribe(d => {
          this.documentService.forwardDocument(d);
          this.onSave.emit(d);
          this.reset();
          this.activeModal.close(d);
        });
      }
    });
  }

  /* ── Reset ── */
  reset(): void {
    this.newDocument  = {};
    this.uploadings   = [];
    this.selectedUsers = [];
    this.currentStep  = 0;
    this.teamSearch   = '';
    this.memberSearch = '';
  }

  /* ── Fermer ── */
  close() {
    this.onClose.emit();
    this.activeModal.close();
  }
}
