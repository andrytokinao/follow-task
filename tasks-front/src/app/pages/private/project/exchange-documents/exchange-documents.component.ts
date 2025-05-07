import {Component, Input, signal} from '@angular/core';
import {DocumentApp, Issue, Project, Uploaded, Uploading, User} from "../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../services/config.service";
import {IssueService} from "../../../../services/issue.service";
import {UserService} from "../../../../services/user.service";
import {AuthService} from "../../../../services/auth.service";
import {BehaviorSubject} from "rxjs";

@Component({
  standalone:false,
  selector: 'app-exchange-documents',
  templateUrl: './exchange-documents.component.html',
  styleUrl: './exchange-documents.component.css'
})
export class ExchangeDocumentsComponent {
  @Input()
  typeDocument:'ISSUE_FILES' | 'COMMENT_FILES' |  'MEDIA_FILES' | 'SOURCE_FILE' | 'DONNE_FILE' | 'MESSEGE_FILES' |'WIKI_FILES' | 'ISSUE_FILES' | 'EXCHANGE_DOCUMENT' ="SOURCE_FILE"
  @Input()
  issue: Issue;
  protected uploadings: Uploading[] = [];
  protected filesToUploads: FileList;
  protected uploadeds: Set<Uploaded>;
  private profile: any;
  private project:Project
  private uploadingDoc ;
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService: ConfigService,
              protected issueService: IssueService,
              private userService: UserService,
              private route: ActivatedRoute,
              private authService: AuthService
  ) {
  }
  documents:DocumentApp[] = [ ];

  ngOnInit(): void {
    this.issueService.project$.subscribe(project=> this.project = project)
    this.authService.getProfile().subscribe((res) => {
      this.profile = res;
      if (this.profile){
        this.document.userApp = {id:this.profile.id}
      }
    });
    this.issueService.issueMaster$.subscribe(master => {
      this.issue = master ;
      if (this.issue) {
        this.loadDocument();
      }
    });
    this.issueService.documents$.subscribe((docs: DocumentApp[]) => {
      this.documents = this.issueService.getDocumentsByType(this.typeDocument,this.issue.id);
      console.log("this.comument",this.documents);
    });
  }

  createDocument(){
    this.issueService.newDocument(this.typeDocument,this.issue).subscribe(doc =>{
      // TODO: process new doc
    });
  }
  selectedFile: Uploaded ;
  document: DocumentApp = {};

  selectFileThis(file: any) {
    this.selectedFile = file;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    console.log('Fichier au-dessus de la zone');
  }
  removeFile(index: number) {
    this.uploadings.splice(index, 1);
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
  selectFiles() {
    document.querySelector<HTMLInputElement>('#fileInput')?.click();
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
  upload() {
    this.document.typeDocument = this.typeDocument;
    this.document.issues = {id:this.issue.id};
    if (this.profile){
      this.document.userApp = {id:this.profile.id}
    }
    this.issueService.uploadDocument(this.document,this.issue.encodedPath,this.uploadings,this.typeDocument).subscribe(document => {
    });
    if (!this.issueService.uploadingDocumentSubject) {
      this.issueService.uploadingDocumentSubject = new BehaviorSubject<DocumentApp>(this.document);
    }
    this.uploadingDoc = this.issueService.uploadingDocumentSubject.asObservable();
    this.uploadingDoc.subscribe(doc=> {
      if (doc.id){
        this.issueService.uploadingDocumentSubject.complete();
        this.uploadings = [];
        this.loadDocument();
      }
    })

  }

  private loadDocument() {
    this.issueService.getDocuments(this.issue.id,this.typeDocument).subscribe(documents => {
      this.issueService.addDocuments(documents);
    })
  }

  selectFile(up: Uploaded) {
    this.selectedFile = up;
  }
  public
  getFileIconClass(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'fas fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fas fa-file-excel';
      case 'zip':
      case 'rar':
      case '7z':
        return 'fas fa-file-archive';
      case 'mp3':
      case 'wav':
        return 'fas fa-file-audio';
      case 'mp4':
      case 'avi':
      case 'mkv':
        return 'fas fa-file-video';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'fas fa-file-image';
      default:
        return 'fas fa-file';
    }
  }
  getFiletype(fileName:string){
    return fileName.split('.').pop()?.toLowerCase();
  }
  step = signal(0);
  defaultOpen: boolean = true;
  fullMode: boolean = false;
  membersDoc: User[] = [];
  selectedDocument: DocumentApp;
  responseDocuments: DocumentApp[];

  setStep(index: number) {
    this.step.set(index);
  }

  nextStep() {
    this.step.update(i => i + 1);
  }

  prevStep() {
    this.step.update(i => i - 1);
  }

  isPdfSelected() {
    if( !this.selectedFile) {
      return false;
    }
    return  'pdf' === this.getFiletype(this.selectedFile.name.toString())
  }

  stopPropagation($event: MouseEvent) {
    $event.stopPropagation();
  }

  selectUser(event: any, user: User) {

  }

  isSelectedUser(id: string) {
    return true;
  }

  createExcange() {

  }

  selectDoc(doc: DocumentApp) {
    this.selectedDocument = doc;
  }

  responseDocument(selectedDocument: DocumentApp) {
      this.issueService.responseDocument(selectedDocument,this.issue).subscribe(doc =>{
        // TODO: process new doc
      });
  }
}
