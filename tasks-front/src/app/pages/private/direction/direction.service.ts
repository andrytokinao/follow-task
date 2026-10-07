import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {DetailProjet, ProjetDirection, TacheProjet} from './direction.model';
import {DIRECTION_PROJETS, DIRECTION_TACHES_PROJET} from './direction.operations';

/** Projets de la société, et les tâches d'un projet. Lecture seule, en GraphQL. */
@Injectable({providedIn: 'root'})
export class DirectionService {

  constructor(private apollo: Apollo) {
  }

  /**
   * Départements et projets en cours de toute la société, en un seul appel :
   * changer d'onglet filtre la liste sans recharger.
   */
  projets(): Observable<{ departements: string[]; projets: ProjetDirection[] }> {
    return this.apollo.query<any>({
      query: DIRECTION_PROJETS,
      fetchPolicy: 'network-only'
    }).pipe(
      map(res => ({
        departements: res.data?.directionDepartements ?? [],
        projets: (res.data?.directionProjets ?? []).map(versProjet)
      })));
  }

  /** Tâches d'un projet, avec leurs assignés et leur nombre de commentaires. */
  detailProjet(projetId: number): Observable<DetailProjet> {
    return this.apollo.query<any>({
      query: DIRECTION_TACHES_PROJET,
      variables: {projetId},
      fetchPolicy: 'network-only'
    }).pipe(
      // Copie modifiable : le compteur de commentaires est mis à jour sur
      // place après un ajout, et Apollo rend des objets figés.
      map(res => ({
        taches: (res.data?.loadSubtask ?? []).map((t: TacheProjet) => ({...t}))
      })));
  }
}

function versProjet(issue: any): ProjetDirection {
  const rapport = issue.rapportProjet ?? {};
  return {
    id: issue.id,
    cle: issue.issueKey,
    nom: issue.summary,
    departement: rapport.departement,
    prefixeDepartement: rapport.prefixeDepartement ?? null,
    avancement: rapport.avancementGlobal ?? 0,
    nombreTaches: rapport.synthese?.nombreTaches ?? 0,
    tachesEnRetard: rapport.synthese?.nombreEnRetard ?? 0,
    heures: rapport.synthese?.totalHeures ?? 0
  };
}
