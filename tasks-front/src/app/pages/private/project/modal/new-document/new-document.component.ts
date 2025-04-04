import {Component, Input} from '@angular/core';
import {DocumentApp, Issue, Uploading, User} from "../../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {BehaviorSubject} from "rxjs";

@Component({
  standalone:false,
  selector: 'app-new-document',
  templateUrl: './new-document.component.html',
  styleUrl: './new-document.component.css'
})
export class NewDocumentComponent {
  uploadings: Uploading[]=[];
  filesToUploads: any;
  newDocument: DocumentApp = {};
  private profile: any;
  private uploadingDoc ;
  protected user:User;

  typeDocument:'ISSUE_FILES' | 'COMMENT_FILES' |  'MEDIA_FILES' | 'SOURCE_FILE' | 'DONNE_FILE' | 'MESSEGE_FILES' |'WIKI_FILES' | 'ISSUE_FILES' ="ISSUE_FILES"
  issue: Issue;
  private allUsers: User[]=[];
  protected userToSelect: User[]=[];
  selectedUsers:String[] = [];
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService: ConfigService,
              protected issueService: IssueService,
              private userService: UserService,
              private route: ActivatedRoute,
              private authService: AuthService,
              public activeModal: NgbActiveModal,

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

  upload() {
    this.newDocument.typeDocument = this.typeDocument;
    this.newDocument.issues = {id:this.issue.id};
    if (this.profile){
      this.newDocument.userApp = {id:this.profile.id}
    }
    this.issueService.uploadDocument(this.newDocument,this.issue.encodedPath,this.uploadings,this.typeDocument).subscribe(document => {
    });
    if (!this.issueService.uploadingDocumentSubject) {
      this.issueService.uploadingDocumentSubject = new BehaviorSubject<DocumentApp>(this.newDocument);
    }
    this.uploadingDoc = this.issueService.uploadingDocumentSubject.asObservable();
    this.uploadingDoc.subscribe(doc=> {
      if (doc.id){
        this.issueService.uploadingDocumentSubject.complete();
        this.uploadings = [];
        this.activeModal.close(doc);
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
    if (event.checked) {
      if (!this.selectedUsers)
        this.selectedUsers = [];
      this.selectedUsers.push(user.id);
    } else {
      this.selectedUsers = this.selectedUsers.filter(cf => cf != user.id);
    }
    return true;
  }
}
