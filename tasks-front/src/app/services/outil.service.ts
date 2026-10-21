import {Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpRequest} from "@angular/common/http";
import {Apollo} from "apollo-angular";
import {map, Observable, shareReplay} from "rxjs";
import {environment} from "../../environments/environment";
import {
  ContenuDossierOutil,
  DossierOutil,
  DossierOutilSaisie,
  FichierOutil,
  Outil,
  OutilSaisie,
  RegleFichiersOutil,
  TypeOutil
} from "../type/outil";
import {
  CONTENU_DOSSIER_OUTIL,
  ENREGISTRER_DOSSIER_OUTIL,
  ENREGISTRER_OUTIL,
  OUTIL,
  RECHERCHER_OUTILS,
  REGLES_FICHIERS_OUTIL,
  SUPPRIMER_DOSSIER_OUTIL,
  SUPPRIMER_FICHIER_OUTIL,
  SUPPRIMER_OUTIL
} from "../type/outil.operations";

/**
 * Menu Outils (DT-019). Lectures hors cache Apollo : un dossier partagé
 * change sous les yeux de tous les espaces, on le redemande à chaque visite.
 * Fichiers en REST, le reste en GraphQL ; le serveur vérifie tous les droits.
 */
@Injectable({
  providedIn: 'root'
})
export class OutilService {

  private regles$?: Observable<RegleFichiersOutil[]>;

  constructor(private readonly apollo: Apollo,
              private readonly http: HttpClient) {
  }

  contenu(espaceId: number, typeOutil: TypeOutil, dossierId: number | null): Observable<ContenuDossierOutil> {
    return this.apollo.query<any>({
      query: CONTENU_DOSSIER_OUTIL,
      variables: {espaceId, typeOutil, dossierId},
      fetchPolicy: 'no-cache'
    }).pipe(map(res => res.data.contenuDossierOutil));
  }

  rechercher(espaceId: number, texte: string): Observable<Outil[]> {
    return this.apollo.query<any>({
      query: RECHERCHER_OUTILS,
      variables: {espaceId, texte},
      fetchPolicy: 'no-cache'
    }).pipe(map(res => res.data.rechercherOutils ?? []));
  }

  outil(espaceId: number, id: number): Observable<Outil> {
    return this.apollo.query<any>({
      query: OUTIL,
      variables: {espaceId, id},
      fetchPolicy: 'no-cache'
    }).pipe(map(res => res.data.outil));
  }

  /** Lues une fois : elles ne changent qu'au redémarrage du serveur. */
  regles(): Observable<RegleFichiersOutil[]> {
    this.regles$ ??= this.apollo.query<any>({query: REGLES_FICHIERS_OUTIL}).pipe(
      map(res => res.data.reglesFichiersOutil ?? []),
      shareReplay(1));
    return this.regles$;
  }

  enregistrerDossier(espaceId: number, saisie: DossierOutilSaisie): Observable<DossierOutil> {
    return this.apollo.mutate<any>({
      mutation: ENREGISTRER_DOSSIER_OUTIL,
      variables: {espaceId, saisie},
      fetchPolicy: 'no-cache'
    }).pipe(map(res => res.data.enregistrerDossierOutil));
  }

  supprimerDossier(espaceId: number, id: number): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: SUPPRIMER_DOSSIER_OUTIL,
      variables: {espaceId, id}
    }).pipe(map(res => !!res.data.supprimerDossierOutil));
  }

  enregistrer(espaceId: number, saisie: OutilSaisie): Observable<Outil> {
    return this.apollo.mutate<any>({
      mutation: ENREGISTRER_OUTIL,
      variables: {espaceId, saisie},
      fetchPolicy: 'no-cache'
    }).pipe(map(res => res.data.enregistrerOutil));
  }

  supprimer(espaceId: number, id: number): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: SUPPRIMER_OUTIL,
      variables: {espaceId, id}
    }).pipe(map(res => !!res.data.supprimerOutil));
  }

  supprimerFichier(espaceId: number, id: number): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: SUPPRIMER_FICHIER_OUTIL,
      variables: {espaceId, id}
    }).pipe(map(res => !!res.data.supprimerFichierOutil));
  }

  /** Envoi d'un fichier, avec la progression. */
  deposer(outilId: number, fichier: File): Observable<HttpEvent<FichierOutil>> {
    const formData = new FormData();
    formData.append('file', fichier, fichier.name);
    const req = new HttpRequest<FormData>('POST', `${environment.apiURL}api/outils/${outilId}/fichiers`, formData, {
      reportProgress: true,
      withCredentials: true
    });
    return this.http.request<FichierOutil>(req);
  }

  /** `apercu` : lu dans le navigateur (vidéo, PDF) plutôt que téléchargé. */
  urlFichier(fichier: FichierOutil, apercu = false): string {
    return `${environment.apiURL}api/outils/fichiers/${fichier.id}${apercu ? '?apercu=true' : ''}`;
  }
}
