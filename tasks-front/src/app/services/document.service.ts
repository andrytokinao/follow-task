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
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = environment.apiURL + "api";
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

  // document.service.ts

  /** Vérifie si un document est lu par l'utilisateur connecté */
  isRead(doc: DocumentApp, userId: string): boolean {
    if (!doc || !userId) return false;
    if (doc.userApp?.id === userId) return true; // créé par moi = toujours lu
    return doc.readStatuses?.some(rs => rs.user?.id === userId) ?? false;
  }

  /** Vérifie si le document a été créé par l'utilisateur connecté */
  isOwnDocument(doc: DocumentApp, userId: string): boolean {
    if (!doc || !userId) return false;
    return doc.userApp?.id === userId;
  }

  /** Compte les réponses non lues d'un document */
  unreadCount(doc: DocumentApp, userId: string): number {
    if (!doc || !userId) return 0;
    if (this.isOwnDocument(doc, userId)) return 0;
    return doc.responses?.filter(r =>
      !r.deleted &&
      !this.isRead(r, userId)
    ).length ?? 0;
  }

  /** Appel backend pour marquer un document comme lu */
  markAsRead(docId: number): Observable<DocumentApp> {
    return this.http.post<DocumentApp>(`${this.apiUrl}/documents/${docId}/read`, {});
  }
}
