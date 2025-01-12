import {Component, Input} from '@angular/core';
import {DocumentApp, Issue, Project, Uploaded, Uploading} from "../../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";


@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent {
  @Input()
  typeDocument:'ISSUE_FILES' | 'COMMENT_FILES' |  'MEDIA_FILES' | 'SOURCE_FILE' | 'DONNE_FILE' | 'MESSEGE_FILES' |'WIKI_FILES' | 'ISSUE_FILES' ="ISSUE_FILES"
  @Input()
  issue: Issue;
  protected uploadings: Uploading[] = [];
  protected filesToUploads: FileList;
  protected isNewFile = false;
  protected uploadeds: Set<Uploaded>;
  private profile: any;
  private project:Project

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
    this.loadDocument();
  }

  createUpload(){
    this.isNewFile = true;
    this.isApercu = !this.isApercu;
    this.selectedFile = null;
  }
  selectedFile: Uploaded ;
  document: DocumentApp = {};
  isApercu: boolean = false;

  selectFileThis(file: any) {
    this.selectedFile = file;
    this.isNewFile = false;
    this.isApercu = !this.isApercu;
    alert(this.isApercu);
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
    this.document.issues = {id:this.issue.id}
    if (this.profile){
      this.document.userApp = {id:this.profile.id}
    }
    this.issueService.uploadDocument(this.document,this.issue.encodedPath,this.uploadings,this.typeDocument).subscribe(document => {
      this.loadDocument();
    })
  }

  private loadDocument() {
    this.issueService.getDocuments(this.issue.id,this.typeDocument).subscribe(documents => {
      this.documents = documents;
    })
  }


  selectFile(up: Uploaded) {
    this.isNewFile = false;
    this.selectedFile = up;
    this.isApercu = !this.isApercu;
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
}
