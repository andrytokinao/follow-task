import {Component, Inject, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {
  Issue,
  Status,
  Comment,
  CustomFieldValue,
  CustomField,
  User,
  Repertoire,
  Uploading, UsingCustomField
} from "../../../../../type/issue";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {supprimerTypename} from "../../../../../type/graphql.operations";
import {stripTypename} from "@apollo/client/utilities";
import {HttpEventType, HttpResponse} from "@angular/common/http";
import {concatMap, Observable} from "rxjs";

import {error} from "@angular/compiler-cli/src/transformers/util";
@Component({
  selector: 'app-view-edit-issue',
  templateUrl: './view-edit-issue.component.html',
  styleUrl: './view-edit-issue.component.css'
})
export class ViewEditIssueComponent implements OnInit{
  type: string = 'type1';
  repertoire:Repertoire = new class implements Repertoire {
    fileName: String="No directory";
    absolutePath:string = 'no';
    path: String ="no";
    repertoires: Repertoire[] =[];
    type: String = "none";
    selected :boolean = false;
    open : boolean = false;
  };
  comment:any = {
    issue:{},
    user:{}
  };
  selected :number = 0;
  selectedFiles:Repertoire[] = [];
  uploading:Uploading[] =[];
  filesToUpload?: FileList;
  progress = 0;
  message = '';
  onFileSelected(repertoire: any) {
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
  comments :Comment[] = [];
  customFieldValue:CustomFieldValue |any= {}
  customFieldValues :CustomFieldValue[] = [];
  usingCustomFields :UsingCustomField[] = [];
  editingDescription: boolean = false;
  activeMenuItem: string="comment";
  newComment: string = '';
  issue: Issue = new Issue();
  curentCustomField?: CustomField;
  currentCustomFieldValue:any = null ;
  users: User[] = [];
  string: String = "tay be ";


  constructor(
    public activeModal: NgbActiveModal,
    public issueService:IssueService,
    public userService:UserService
  ) {}
  editDescription(){
    this.editingDescription =!this.editingDescription;
  }
  save() {
    this.issueService.saveIssue(this.issue).subscribe(
      {
        next: (res: any) => {
          this.activeModal.close({issue: stripTypename(res.data.saveIssue) as Issue});
        },
        error :(err)=>{
          alert(JSON.stringify(err))
        }
      }
    );
  }
  toggleMenu(menu:string) {
    this.activeMenuItem = menu;
  }

  addComment() {
    this.comment.user.id = this.issue.assigne.id;// TODO: Change to user connected
    this.comment.issue.id = this.issue.id;

    this.issueService.addComment(this.comment).subscribe(
      {
        next:(result:any)=>{
          console.info("--- Loadin adding comment ---> "+JSON.stringify(result));
          this.comments = result.data.addComment as Comment[];
          this.comment.text="";
        },
          error:(err)=>{
        alert(JSON.stringify(err));
      }
    });
  }
  loadComments(){
    console.info("--- Loading  comment ---")
    this.issueService.allComment(this.issue.id).subscribe(
      {
        next:(res:any)=>{
          this.comments =res.data.allComment as Comment[];
          console.info("--- Loadin comment ---> "+JSON.stringify(this.comments));
        },
        error:(err:any)=>{
          alert(JSON.stringify(err))
        }
      }
    );
  }
  loadValues(){
    console.info("--- Loading  values ---")
    this.issueService.getValues(this.issue.id).subscribe(
      {
        next:(res:any)=>{
          this.customFieldValues =res.data.getValues as CustomFieldValue[];
          console.info("--- Loadin customField values ---> "+JSON.stringify(this.customFieldValues));
        },
        error:(err:any)=>{
          alert(JSON.stringify(err))
        }
      }
    );
  }
  customFieldsByIssueType(){
    console.info("--- Loading all customFields ---");
    this.issueService.customFieldsByIssueType(this.issue.issueType.id).subscribe(
      {
        next:(usingCustomFields)=>{
          this.usingCustomFields =usingCustomFields;
        }
      }
    );
  }
  addCustomFieldValue(usingCustomField:UsingCustomField) {
    this.currentCustomFieldValue = {};
    let issue:any = {};
    issue.id = this.issue.id;
    this.currentCustomFieldValue.customField = usingCustomField.customField;
    this.currentCustomFieldValue.issue = issue;
  }
  saveValue() {
    this.currentCustomFieldValue.issue = this.issue;
    let value = supprimerTypename(this.currentCustomFieldValue);
    this.issueService.saveValues(value).subscribe({
      next:((res:any)=>{
        alert('Saving saccessful  ');
        this.customFieldValues= stripTypename(res.data.saveValue);
      }),
      error:(err=>{
        console.error(' error  '+JSON.stringify(err))
      })
      }
    )
    this.currentCustomFieldValue = null;
  }
  loadDirectory(){
    this.issueService.loadDirectory(this.issue.id).subscribe((res:any)=>{
      this.repertoire = res;
    })
  }

  valueIsValid() :boolean{
    if(this.currentCustomFieldValue == null)
      return false;
    return this.currentCustomFieldValue.text!=null ||
      this.currentCustomFieldValue.numeric !=null ||
      this.currentCustomFieldValue.string !=null ||
      this.currentCustomFieldValue.date !=null ||
      this.currentCustomFieldValue.user !=null;
  }

  downloadUrl(): string {
    return this.issueService.generateDownloadUrl(this.selectedFiles, this.repertoire.fileName);
  }

  selectFile(event: any): void {
    this.filesToUpload = event.target.files;
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      let uploading: Uploading = new class implements Uploading {
        file: File = files.item(i)!;
        progression: number = 0;
        status: string = '';
      }
      this.uploading.push(uploading);
    }
  }

  removeFile(index: number) {
    this.uploading.splice(index, 1);
  }

  upload() {
    this.sendSequentialUpload(this.uploading,this.repertoire.absolutePath)
      .subscribe(
        () => {
        },
        error => {
          console.error('Error:', error);
        }
    )
  }

  removeElementAtIndex(array: any[], index: number): void {
    if (index > -1) {
      array.splice(index, 1);
    }
  }

  sendSequentialUpload(ups: Uploading[], directory: string): Observable<any> {
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
          return this.sendSequentialUpload(ups, directory);
        })
      );
    } else {
      return this.sendSequentialUpload(ups,directory);
    }
  }

  ngOnInit(): void {
    this.customFieldValue.id = 0;
    this.customFieldValue.issue = {}
    let customField : CustomField | any = {};
    customField.name = "Test ";
    customField.type = "Date";
    this.customFieldValue. customField = customField;
    this.loadComments();
    this.loadValues();
    this.customFieldsByIssueType();
    this.loadDirectory();
  }

    protected readonly event = event;

  saveCustomFieldValue(event: CustomFieldValue) {
    this.issueService.saveValues(event).subscribe(value =>
      (values:CustomFieldValue[]) => {
         this.customFieldValues = values;
      }
    );
  }
}
