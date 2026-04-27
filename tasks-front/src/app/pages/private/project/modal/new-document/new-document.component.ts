import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DocumentApp, Issue, Project, Uploading, User} from "../../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {BehaviorSubject} from "rxjs";
import {DocumentService} from "../../../../../services/document.service";

@Component({
  standalone:false,
  selector: 'app-new-document',
  templateUrl: './new-document.component.html',
  styleUrl: './new-document.component.css'
})
export class NewDocumentComponent {
  uploadings: Uploading[]=[];
  @Input() selectedProject:Project | undefined = undefined;
  @Input() mode: 'create' | 'reply' | 'comment' = 'create';
  private priorityUsers: User[] = [];
  @Input() set parentDocument(doc: DocumentApp) {
    this._parentDocument = doc;
    this.reset();
  }
  reset(): void {
    this.newDocument = {};
    this.uploadings = [];
    this.selectedUsers = [];
  }
  filesToUploads: any;
  newDocument: DocumentApp = {};
  get parentDocument(): DocumentApp {
    return this._parentDocument;
  }

  private _parentDocument: DocumentApp;
  private profile: any;
  private uploadingDoc ;
  protected user:User;

  typeDocument:'ISSUE_FILES' | 'COMMENT_FILES' |  'MEDIA_FILES' | 'SOURCE_FILE' | 'DONNE_FILE' | 'MESSEGE_FILES' |'WIKI_FILES' | 'ISSUE_FILES' | 'EXCHANGE_DOCUMENT' | 'RESPONSE_DOCUMENT' ="ISSUE_FILES"
  issue: Issue;
  private allUsers: User[]=[];
  protected userToSelect: User[]=[];
  selectedUsers:String[] = [];
  private project: Project;
  selectTeams: boolean = false;
  projSearch: any;
  selectedDocument: any;
  filteredProjects: Project[] = [];
  projects:Project[] = [];
  @Output() onSave = new EventEmitter<DocumentApp>();
  @Output() onClose = new EventEmitter<void>();
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService: ConfigService,
              protected issueService: IssueService,
              private userService: UserService,
              private route: ActivatedRoute,
              private authService: AuthService,
              public activeModal: NgbActiveModal,
              private documentService:DocumentService

  ) {
    this.userService.users$.subscribe(users=> {
      this.allUsers = users;
      if (this.user && this.user.id) {
        this.userToSelect= [... this.allUsers].filter(u => u.id != this.user.id);
      } else {
        this.userToSelect= [... this.allUsers];
      }
    });
    this.authService.connectedUser$.subscribe( user => {
      this.user = user;
      if (this.user && this.user.id) {
        this.userToSelect= [... this.allUsers].filter(u => u.id != this.user.id);
      } else {
        this.userToSelect= [... this.allUsers];
      }
    });
    this.issueService.project$.subscribe(project =>{
      this.project = project;
    });
    this.issueService.allProject$.subscribe(prs => {
      this.projects = prs;
      this.filteredProjects = prs;
    })
  }
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    console.log('Fichier au-dessus de la zone');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.filesToUploads = event.dataTransfer?.files;
      for (let i = 0; i < event.dataTransfer?.files.length; i++) {
        console.debug("uploading",event.dataTransfer?.files.item(i)!);
        let uploading: Uploading = new class implements Uploading {
          file: File = event.dataTransfer?.files.item(i)!;
          progression: number = 0;
          status:  '';
        }
        this.uploadings.push(uploading);
      }
    }
  }

  saveDocument() {
    if (this.parentDocument) {
      this.newDocument.parent = {id: this.parentDocument.id};
      this.newDocument.titre = 'Re:' + this.parentDocument.titre;
    }
    if (this.newDocument.id) {
      // Edition
      this.issueService.uploadDocument(this.newDocument,this.issue?.encodedPath,this.uploadings,this.typeDocument).subscribe(document => {
        if (!this.uploadings || this.uploadings.length === 0) {
          this.documentService.forwardDocument(document);
          this.activeModal.close(document);
          this.reset();
        }
      });
      return;
    }


    if (this.typeDocument)
      this.newDocument.typeDocument = this.typeDocument;
    if (this.issue){
      this.newDocument.issues = {id:this.issue.id};
    }
    if (this.user){
      if (!this.newDocument.userApp) {
        this.newDocument.userApp = {id: this.user.id}
      }
    }
    if (this.selectedUsers && this.selectedUsers.length > 0){
      let userIds = [...this.selectedUsers];
      userIds.push(this.user.id);
      this.newDocument.members = userIds;
    }
    if (this.parentDocument){
      this.newDocument.parent = {id:this.parentDocument.id};
      this.newDocument.titre = 'Re:'+this.parentDocument.titre;
    }
    this.issueService.uploadDocument(this.newDocument,this.issue?.encodedPath,this.uploadings,this.typeDocument).subscribe(document => {
       if (!this.uploadings || this.uploadings.length === 0) {
         this.documentService.forwardDocument(document);
         this.activeModal.close(document);
         this.onSave.emit(document);
         this.reset();
       }
    });
    if (!this.issueService.uploadingDocumentSubject) {
      this.issueService.uploadingDocumentSubject = new BehaviorSubject<DocumentApp>(this.newDocument);
    }
    this.uploadingDoc = this.issueService.uploadingDocumentSubject.asObservable();
    this.uploadingDoc.subscribe(doc=> {
      if (doc.id){
        this.issueService.uploadingDocumentSubject.complete();
        this.uploadings = [];
        this.documentService.loadDocumentById(doc.id).subscribe(d => {
         this.documentService.forwardDocument(d);
          this.onSave.emit(d);
          this.reset();
          this.activeModal.close(d);
        });
      }
    })

  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    console.debug("drop ici ");
    if (input.files) {
      console.debug("input.files",input.files);
      this.filesToUploads = input.files;
      for (let i = 0; i < input.files.length; i++) {
        let uploading: Uploading = new class implements Uploading {
          file: File = input.files.item(i)!;
          progression: number = 0;
          status:  '';
        }
        this.uploadings.push(uploading);
      }
    }
  }

  removeFile(index: number) {
    this.uploadings.splice(index, 1);
  }

  isSelectedUser(id: string) {
    return this.selectedUsers.some(usr=> usr === id);
  }

  selectUser(event: any, user: User) {
    const checked = event.target.checked;
    if (checked) {
      if (!this.selectedUsers) {
        this.selectedUsers = [];
      }
      this.selectedUsers.push(user.id);
    } else {
      this.selectedUsers = this.selectedUsers.filter(cf => cf != user.id);
    }
  }

  selectProject(p: Project) {
      this.newDocument.project = {id:p.id};
      this.selectedUsers = [];
      this.loadPriorityDestination(p.prefix);
  }

  close() {
    this.onClose.emit();
    this.activeModal.close();
  }

  isFormValid(): boolean {
    if (this.mode === 'reply') {
      return !!(this.newDocument.description || this.uploadings.length > 0);
    }
    if (this.mode === 'comment') {
      return !!(this.newDocument.description || this.uploadings.length > 0);
    }
    if (!this.selectedUsers || this.selectedUsers.length == 0)
      return false;

    return !!(this.newDocument.project &&
      (this.newDocument.description || this.uploadings.length > 0));
  }
  public loadPriorityDestination(projectPrefix:String) {
    this.userService.getUserForProjectAndRole(projectPrefix,['ADMIN','PROJECT_MANAGER']).subscribe(users=> {
      this.userToSelect = users;
    });
  }
}
