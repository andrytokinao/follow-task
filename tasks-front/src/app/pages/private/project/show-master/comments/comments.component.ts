import {Component, Input, Output,EventEmitter} from '@angular/core';
import {
  Comment,
  CustomField,
  CustomFieldValue, DocumentApp,
  Issue,
  IssueType,
  Uploading,
  UsingCustomField
} from "../../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {Observable} from "rxjs";

@Component({
  standalone:false,
  selector: 'comments-componets',
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.css'
})
export class CommentsComponent {
  @Output() onSaved  = new EventEmitter<DocumentApp>()
  private project: any;
  private issue: Issue;
  protected parentIssue: any;
  protected issueType:IssueType | undefined;
  document: DocumentApp = {};

  expaces:any[]=[];
  documents:DocumentApp[]=[];
  customFieldValue:CustomFieldValue |any= {}
  customFieldValues :CustomFieldValue[] = [];
  newValues:CustomFieldValue[] =[];
  usingCustomFields :UsingCustomField[] = [];
  values : CustomFieldValue[]=[];
  currentCustomFieldValue:any = null ;
  viewModeField: string='info-edit';
  activeMenuItem: string;
  profile:any  = {};

  comment:any = {
    issue:{},
    user:{}
  };
  protected filesToUploads: FileList;
  typeDocument?:'ISSUE_FILES' | 'COMMENT_FILES' |  'MEDIA_FILES' | 'SOURCE_FILE' | 'DONNE_FILE' | 'MESSEGE_FILES' |'WIKI_FILES' | 'ISSUE_FILES' | 'EXCHANGE_DOCUMENT' = 'COMMENT_FILES';
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService:ConfigService,
              protected issueService:IssueService,
              protected userService:UserService,
              private route: ActivatedRoute,
              private authService: AuthService
  ) {
  }
  ngOnInit(): void {
    this.route.data.subscribe(data => {


    });
    this.issueService.issueMaster$.subscribe(issue => {
      this.parentIssue = issue;
      this.loadDocument();

    })
    this.issueService.project$.subscribe(project=> this.project = project)
    this.authService.getProfile().subscribe((res)=>{
      this.profile = res;
    });
  }
  comments :Comment[] = [];
  protected uploadings: Uploading[] = [];

  addComment() {
    this.comment.issue.id = this.parentIssue.id;
    this.issueService.addComment(this.comment,this.parentIssue.encodedPath,this.uploadings).subscribe(res=>{
      this.loadComments();
      this.comment.text ="";
    });
  }
  loadComments(){
    console.info("--- Loading  comment ---")
    this.issueService.allComment(this.parentIssue.id).subscribe(comments =>{
        this.comments = comments;
      }
    );
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
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

  selectFiles() {
    document.querySelector<HTMLInputElement>('#fileInput')?.click();
  }

  removeFile(index: number) {
    this.uploadings.splice(index, 1);
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
        let uploading: Uploading = new class implements Uploading {
          file: File = event.dataTransfer?.files.item(i)!;
          progression: number = 0;
          status:  '';
        }
        this.uploadings.push(uploading);
      }
    }
  }
  private loadDocument() {
    this.issueService.getDocuments(this.parentIssue.id,this.typeDocument).subscribe(documents => {
      this.documents = documents;
    })
  }

  addDocument() {
    this.document.typeDocument = this.typeDocument;
    this.document.titre ="Commentaire";
    this.document.issues = {id:this.parentIssue.id}
    if (this.profile){
      this.document.userApp = {id:this.profile.id}
    }

    this.issueService.uploadDocument(this.document,this.parentIssue.encodedPath,this.uploadings,this.typeDocument).subscribe(document => {
      this.document.titre ="";
      this.document.description ="";
      this.loadDocument();
    })
  }
}
