import {Component, OnInit} from '@angular/core';
import {IssueService} from "../../../../../services/issue.service";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {CustomFieldValue, Issue, IssueType, Repertoire, Uploading, UsingCustomField} from "../../../../../type/issue";
import {concatMap, Observable} from "rxjs";
interface Livraison {
  repertoire:Repertoire;
  uploading:Uploading[] ;
  filesToUpload?: FileList;
}
@Component({
  selector: 'app-uploaded-files',
  templateUrl: './uploaded-files.component.html',
  styleUrl: './uploaded-files.component.css'
})
export class UploadedFilesComponent implements OnInit{
  uploadedFiles: Array<{ name: string, userPhotoUrl: string, uploadDate: Date }> = [];
  selectedFiles:Repertoire[] = [];

  private project: any;
  private issue: Issue;
  protected parentIssue: any;
  protected issueType:IssueType | undefined;
  customFieldValue:CustomFieldValue |any= {}
  usingCustomFields :UsingCustomField[] = [];
  livraisons:Livraison[]=[];
  values : CustomFieldValue[]=[];
  filesToUpload?: FileList;
  uploading:Uploading[] =[];

  profile:any  = {};
  repertoire:Repertoire = new class implements Repertoire {
    fileName: String="No directory";
    absolutePath:string = 'no';
    path: String ="no";
    repertoires: Repertoire[] =[];
    type: String = "none";
    selected :boolean = false;
    open : boolean = false;
    paths:string[] =[];
  };
  selected: number = 0;

  selectFiles() {
    document.querySelector<HTMLInputElement>('#fileInput')?.click();
  }
  constructor(
    private router: Router,
    private modalService: NgbModal,
    private configService:ConfigService,
    private issueService:IssueService,
    protected userService:UserService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
  }
  selectFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        this.uploadedFiles.push({
          name: file.name,
          userPhotoUrl: 'assets/default-user-photo.jpg',
          uploadDate: new Date()
        });
      });
    }
  }

  loadDirectory(){
    this.issueService.loadDirectory(this.parentIssue.id).subscribe((res:any)=>{
      this.repertoire = res;
      this.livraisons = [];
      for (let r of this.repertoire.repertoires){
        this.livraisons.push(this.createLivraisons(r));
      }
    })
  }
  createLivraisons(r:Repertoire):Livraison{
    let livraison=  {
      repertoire :r,
      uploading :[],
      filesToUpload:undefined
    }
    livraison.repertoire.open = true;
    return livraison;
  }
  ngOnInit(): void {
    this.issueService.project$.subscribe(project=> this.project = project)
    this.route.data.subscribe(data => {
      this.parentIssue = data['parrentIssue'];
      this.loadDirectory();
    });
    this.authService.getProfile().subscribe((res)=>{
      this.profile = res;
    });
  }
  onFileSelected(event: Event,l:Livraison): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      l.filesToUpload = input.files;
      for (let i = 0; i < input.files.length; i++) {
        let uploading: Uploading = new class implements Uploading {
          file: File = input.files.item(i)!;
          progression: number = 0;
          status:  '';

        }
        l.uploading.push(uploading);
      }
    }
  }
  removeFile(index: number,l:Livraison) {
    l.uploading.splice(index, 1);
  }
  onDragOver(event: DragEvent,l:Livraison): void {
    event.preventDefault();
    console.log('Fichier au-dessus de la zone');
  }

  onDrop(event: DragEvent,l:Livraison): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      l.filesToUpload = event.dataTransfer?.files;
      for (let i = 0; i < event.dataTransfer?.files.length; i++) {
        let uploading: Uploading = new class implements Uploading {
          file: File = event.dataTransfer?.files.item(i)!;
          progression: number = 0;
          status :'';
        }
        l.uploading.push(uploading);
      }
    }
  }
  upload(l:Livraison) {
    this.sendSequentialUpload(l.uploading,l.repertoire.absolutePath,l)
      .subscribe(
        () => {
        },
        error => {
          console.error('Error:', error);
        }
      )
  }
  sendSequentialUpload(ups: Uploading[], directory: string,l:Livraison): Observable<any> {
    if (ups.length === 0) {
      this.loadDirectory();
      return new Observable(observer => {
        observer.complete();
      });
    }
    const up = ups.shift();
    if(up) {
      return this.issueService.upload(up.file, directory).pipe(
        concatMap(() => {
          this.removeElementAtIndex(ups, 0);
          return this.sendSequentialUpload(ups, directory,l);
        })
      );
    } else {
      return this.sendSequentialUpload(ups,directory,l);
    }
  }
  removeElementAtIndex(array: any[], index: number): void {
    if (index > -1) {
      array.splice(index, 1);
    }
  }
  downloadUrl() {
    return this.issueService.generateDownloadUrl(this.selectedFiles, this.repertoire.fileName);

  }
  onFileSelectedToDownload(repertoire: any) {
    if (repertoire.selected) {
      this.selectedFiles.push(repertoire);
    } else {
      const index = this.selectedFiles.findIndex(file => file === repertoire);
      if (index !== -1) {
        this.selectedFiles.splice(index, 1);
      }
    }
    this.selected = this.selectedFiles.length;

    console.log('Fichiers sélectionnés :', this.selectedFiles);
  }
}
