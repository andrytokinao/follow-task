import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {DocumentApp, DocumentMember, DocumentPage} from "../type/issue";
import {Apollo} from "apollo-angular";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  constructor(
    private apollo:Apollo,
    private http:HttpClient
  ) {

  }
  addMemberToDocument(documentid:number, userId:String) {
    return new Observable<DocumentMember>();
  }

  removeMemberFromDocument(number: number, id: string) {
    return new Observable();
  }

  searchDocuments(search: { deleted: boolean; keyword: string; projectId: number }, currentPage: number, pageSize: number) {
    return new Observable<DocumentPage>()
  }

  attachDocumentToIssue(number: number, number2: number) {
    return new Observable();
  }

  replyToDocument(number: number, reply: DocumentApp) {
    return new Observable<DocumentApp>();
  }

  createDocument(projectId: number) {
    let docu :DocumentApp = {
      project:{id:projectId},
      description:'',
      titre:''
    }
    return new Observable<DocumentApp>(observer => {
      observer.next(docu);
      observer.complete();
    });
  }

  attachDocumentToProject(number: number, number2: number) {
    return new Observable();
  }
}
