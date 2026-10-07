import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {Observable, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {DetailProjet, ProjetDirection, TacheProjet, TempsPersonne} from './direction.model';
import {DIRECTION_PROJETS, DIRECTION_TACHES_PROJET, DIRECTION_TEMPS_PAR_PERSONNE} from './direction.operations';

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

  /** Tâches d'un projet, avec le temps de chaque personne sur chacune. */
  detailProjet(projetId: number): Observable<DetailProjet> {
    return this.apollo.query<any>({
      query: DIRECTION_TACHES_PROJET,
      variables: {projetId},
      fetchPolicy: 'network-only'
    }).pipe(
      switchMap(res => {
        const taches: TacheProjet[] = res.data?.loadSubtask ?? [];
        if (!taches.length) {
          return of({taches, tempsParTache: new Map<number, TempsPersonne[]>()});
        }
        return this.tempsParTache(taches.map(t => t.id as number)).pipe(
          map(tempsParTache => ({taches, tempsParTache})));
      }));
  }

  private tempsParTache(issueIds: number[]): Observable<Map<number, TempsPersonne[]>> {
    return this.apollo.query<any>({
      query: DIRECTION_TEMPS_PAR_PERSONNE,
      variables: {issueIds},
      fetchPolicy: 'network-only'
    }).pipe(
      map(res => {
        const parTache = new Map<number, TempsPersonne[]>();
        for (const resume of res.data?.getIssuePlanningSummaries ?? []) {
          if (resume?.issue?.id != null) {
            parTache.set(Number(resume.issue.id), resume.userStats ?? []);
          }
        }
        return parTache;
      }),
      // Sans le détail des heures, les tâches restent lisibles.
      catchError(() => of(new Map<number, TempsPersonne[]>())));
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
    tachesEnRetard: rapport.synthese?.nombreEnRetard ?? 0
  };
}
