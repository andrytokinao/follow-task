import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {
  DocumentApp,
  DocumentMember,
  DocumentPage,
  DocumentSearch,
  DocumentUsageTypeMeta,
  IssuePlanningSummary
} from "../type/issue";
import {Apollo} from "apollo-angular";
import {HttpClient} from "@angular/common/http";
import * as operation from "../type/graphql.operations";
import {supprimerTypename} from "../type/graphql.operations";

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private documentUsageTypesSubject = new BehaviorSubject<DocumentUsageTypeMeta[]>([]);
  documentUsageTypes$ = this.documentUsageTypesSubject.asObservable();


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
  documentUsageTypes(){
    return new Observable<DocumentUsageTypeMeta[]>((observer)=>{
      this.apollo.query(
        {
          query:operation.DOCUMENT_USAGE_TYPES,
          fetchPolicy:'cache-first'
        }
      ).subscribe((res:any)=> {
        observer.next(res.data.documentUsageTypes);
        observer.complete();
      }, error => {
        console.error(error);
        observer.error(error);
        observer.complete();
      });
    });
  }
  loadDocumentUsageTypes(){

    this.documentUsageTypes().subscribe(usageTypes =>
      this.documentUsageTypesSubject.next(usageTypes))
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

  attachDocumentToIssue(issueId: number, documentId:number, usages: String[]) {
    return new Observable<IssuePlanningSummary>(observer => {
      this.apollo.mutate({
        mutation:operation.ATTACH_DOCUMENT_TO_ISSUE,
        variables:{issueId,documentId,usages}
      }).subscribe( (res:any) => {
        observer.next(res.data.attachDocumentToIssue);
        observer.complete();
      }, error => {
        console.error(error);
        observer.error(error);
        observer.complete();
      })
    });
  }
  // Clé de stockage : 'doc_read_{userId}_{docId}'
  private readKey(docId: number | string, userId: string): string {
    return `doc_read_${userId}_${docId}`;
  }

  /** Marque un document comme lu pour l'utilisateur connecté */
  markAsRead(doc: DocumentApp, userId: string): void {
    localStorage.setItem(this.readKey(doc.id!, userId), 'true');
  }

  /** Retourne true si le document a été lu OU s'il a été créé par cet utilisateur */
  isRead(doc: DocumentApp, userId: string): boolean {
    if (doc.userApp?.id === userId) return true; // créé par moi => toujours "lu"
    return localStorage.getItem(this.readKey(doc.id!, userId)) === 'true';
  }

  /** Retourne true si le document a été créé par l'utilisateur connecté */
  isOwnDocument(doc: DocumentApp, userId: string): boolean {
    return doc.userApp?.id === userId;
  }
}
