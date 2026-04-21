import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {DocumentApp, DocumentMember, DocumentPage, DocumentSearch} from "../type/issue";
import {Apollo} from "apollo-angular";
import {HttpClient} from "@angular/common/http";
import * as operation from "../type/graphql.operations";
import {supprimerTypename} from "../type/graphql.operations";

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

  searchDocuments(search: DocumentSearch, page: number, pageSize: number) {
    return new Observable<DocumentPage>((observer)=>{
      this.apollo.query(
        {
          query: operation.SEARCH_DOCUMENTS,
          variables: {search,page,pageSize},
          fetchPolicy: 'network-only'
        }
      ).subscribe((res:any) =>{
         observer.next(supprimerTypename(res.data.searchDocuments));
         observer.complete();
      }, error => {
        console.error("searchDocuments:",error);
        alert(JSON.stringify(error));
        observer.error(error);
        observer.complete();
      })
    });
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
