import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {DetailProjet, EspaceDirection, PlageMembre, PlageTache, ProjetDirection, ProjetGantt, TacheGantt, TacheProjet} from './direction.model';
import {
  DIRECTION_ESPACES,
  DIRECTION_GANTT_PROJET,
  DIRECTION_GANTT_PROJETS,
  DIRECTION_PROJETS,
  DIRECTION_TACHES_PROJET,
  PLAGES_MEMBRES,
  PLAGES_PROJETS,
  SITUATION_DIRECTION
} from './direction.operations';
import {SituationDirection} from './situation/situation.model';

/** Projets de la société, et les tâches d'un projet. Lecture seule, en GraphQL. */
@Injectable({providedIn: 'root'})
export class DirectionService {

  constructor(private apollo: Apollo) {
  }

  /** Espaces de travail, triés par nom : le cockpit en affiche toujours un. */
  espaces(): Observable<EspaceDirection[]> {
    return this.apollo.query<any>({
      query: DIRECTION_ESPACES,
      fetchPolicy: 'network-only'
    }).pipe(map(res => res.data?.directionEspaces ?? []));
  }

  /** Projets en cours du département (espace de travail) ; toute la société si null. */
  projets(departement: string | null): Observable<ProjetDirection[]> {
    return this.apollo.query<any>({
      query: DIRECTION_PROJETS,
      variables: {departement},
      fetchPolicy: 'network-only'
    }).pipe(map(res => (res.data?.directionProjets ?? []).map(versProjet)));
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

  /** Tâches d'un projet avec leurs séances de planning, pour le diagramme de Gantt. */
  ganttProjet(projetId: number): Observable<TacheGantt[]> {
    return this.apollo.query<any>({
      query: DIRECTION_GANTT_PROJET,
      variables: {projetId},
      fetchPolicy: 'network-only'
    }).pipe(map(res => res.data?.loadSubtask ?? []));
  }

  /** Situation du jour (DT-005) du département ; toute la société si null. */
  situation(departement: string | null): Observable<SituationDirection | null> {
    return this.apollo.query<any>({
      query: SITUATION_DIRECTION,
      variables: {departement},
      fetchPolicy: 'network-only'
    }).pipe(map(res => res.data?.situationDirection ?? null));
  }

  /**
   * Temps occupé par les séances de ces personnes sur la période, tous projets
   * confondus. `debut`, `fin` : date-heures `yyyy-MM-ddTHH:mm:ss`.
   */
  plagesMembres(userIds: string[], debut: string, fin: string): Observable<PlageMembre[]> {
    return this.apollo.query<any>({
      query: PLAGES_MEMBRES,
      variables: {userIds, debut, fin},
      fetchPolicy: 'network-only'
    }).pipe(map(res => res.data?.plagesMembres ?? []));
  }

  /** Temps occupé par les séances de ces projets et de leurs tâches sur la période. */
  plagesProjets(projetIds: number[], debut: string, fin: string): Observable<PlageTache[]> {
    return this.apollo.query<any>({
      query: PLAGES_PROJETS,
      variables: {projetIds, debut, fin},
      fetchPolicy: 'network-only'
    }).pipe(map(res => res.data?.plagesProjets ?? []));
  }

  /** Projets en cours du département avec leurs tâches et leurs dates, pour le Gantt de direction. */
  ganttProjets(departement: string): Observable<ProjetGantt[]> {
    return this.apollo.query<any>({
      query: DIRECTION_GANTT_PROJETS,
      variables: {departement},
      fetchPolicy: 'network-only'
    }).pipe(map(res => res.data?.directionProjets ?? []));
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
    heures: rapport.synthese?.totalHeures ?? 0,
    statut: issue.status
      ? {libelle: issue.status.displayName, couleur: issue.status.color ?? null}
      : null,
    // Copie modifiable, comme pour les tâches : Apollo rend des objets figés.
    issue: {...issue}
  };
}
