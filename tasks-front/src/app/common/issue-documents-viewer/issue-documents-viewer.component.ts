import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {DocumentApp, Issue, Uploading, UploadingState, User} from "../../type/issue";
import {NgClass, NgForOf, NgIf} from "@angular/common";
import {IssueService} from "../../services/issue.service";
import {DayPilot} from "@daypilot/daypilot-lite-angular";
import {interval, Observable} from "rxjs";
import {UserService} from "../../services/user.service";


interface DocumentAppWithToggle extends DocumentApp {
  _open?: boolean;
}
@Component({
  selector: 'app-issue-documents-viewer',
  templateUrl: './issue-documents-viewer.component.html',
  imports: [
    NgClass,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./issue-documents-viewer.component.scss']
})
export class IssueDocumentsViewerComponent implements OnInit , AfterViewInit {

  @Input() issue$: Observable<Issue>;
  issue:Issue;

  @Input() typeDocument: string;
  documents: DocumentAppWithToggle[] = [];
  uploadingFiles: Uploading[] = [];
  uploading:UploadingState = undefined;
  constructor(private issueService:IssueService, private userService:UserService) {
  }
  ngOnInit(): void {
    this.issue$.subscribe(issue => {
      this.issue = issue;
      if (this.typeDocument && this.issue)
        this.loaDocument();
    })
  }

  // Date relative
  getRelativeDate(creation?: string): string {
    if (!creation) return "";

    const date = new Date(creation);
    if (isNaN(date.getTime())) return "";

    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "à l’instant";
    if (minutes < 60) return `il y a ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;

    const days = Math.floor(hours / 24);
    return `il y a ${days} jours`;
  }

  // Icônes selon extension
  getFileIcon(name: String): string {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'fa-file-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png': return 'fa-file-image';
      case 'doc':
      case 'docx': return 'fa-file-word';
      case 'xls':
      case 'xlsx': return 'fa-file-excel';
      case 'zip':
      case 'rar': return 'fa-file-archive';
      default: return 'fa-file';
    }
  }

  toggle(doc: DocumentAppWithToggle) {
    doc._open = !doc._open;
  }

  // Petite liste mock pour tester
  mockDocuments(): DocumentApp[] {
    return [
      {
        titre: "Contrat",
        description: "Contrat signé par le client",
        creation: "2025-11-13T14:20:00",
        userApp: {
          id: "1",
          firstName: "Sarah",
          lastName: "Rami",
          photo: "https://i.pravatar.cc/100?img=7"
        },
        uploadeds: [
          { id:1, encodedPath:"", name:"contrat.pdf", path:"/mock/contrat.pdf", document: undefined! }
        ]
      },
      {
        creation: "2025-11-12T10:00:00",
        userApp: {
          id: "2",
          firstName: "Paul",
          lastName: "Rakoto",
          photo: "https://i.pravatar.cc/100?img=12"
        },
        uploadeds: [
          { id:2, encodedPath:"", name:"capture.png", path:"/mock/capture.png", document: undefined! },
          { id:3, encodedPath:"", name:"note.docx", path:"/mock/note.docx", document: undefined! }
        ]
      }
    ];
  }

  private loaDocument() {
    this.issueService.getDocuments(this.issue.id,this.typeDocument).subscribe( documents => {
      this.documents = documents;
    })
  }
  onDrop(event: DragEvent) {
    event.preventDefault();

    if (event.dataTransfer?.files?.length) {
      this.addFiles(event.dataTransfer.files);
    }
  }
  onFileSelected(event: any) {
    const files = event.target.files;
    this.addFiles(files);
  }
  addFiles(fileList: FileList) {
    Array.from(fileList).forEach((file) => {
      this.uploadingFiles.push({
        file,
        progression: 0,
        status: "pending"
      });
    });
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }
  uploadAll() {
    if (!this.uploadingFiles)
      return;
    this.issueService.uploadIssueFileDocument(this.uploadingFiles,this.issue ). subscribe(res => {

    })
  }

  ngAfterViewInit(): void {
    this.issueService.uploadingState$.subscribe( up => {
      if (!up)
        return;
      this.uploading = up;
      if (up.status =='finished') {
        this.uploadingFiles = [];
        this.uploading = undefined;
        this.loaDocument();
      }

    })
  }

  getPhotoUser(userApp: User) {
    return this.userService.getUrlPhoto(userApp);
  }
}
