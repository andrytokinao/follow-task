import {Injectable} from '@angular/core';
import {Apollo} from "apollo-angular";
import {map, Observable} from "rxjs";
import {Issue, IssueType, Phase, ResponseApp, Status, TypesSousTacheParPhase} from "../type/issue";
import {supprimerTypename} from "../type/graphql.operations";
import {
  DELETE_PHASE,
  DELIER_STATUT_PHASE,
  LIER_STATUT_PHASE,
  ORDONNER_PHASES,
  PHASE_DE_TACHE,
  PHASES_BY_PROJECT,
  SAVE_PHASE,
  SET_ISSUE_PHASE,
  SET_ISSUE_TYPE_PHASES,
  STATUTS_PROJET_POUR_PHASES,
  TYPES_SOUS_TACHE_PAR_PHASE
} from "../type/phase.operations";

/**
 * Phases de projet : paramétrage (phases, ordre, portée, statuts), phases des
 * types, et phase des tâches.
 */
@Injectable({
  providedIn: 'root'
})
export class PhaseService {

  constructor(private apollo: Apollo) {
  }

  // ---- phases ----

  /** Phases de l'espace de travail et phases communes, dans l'ordre du projet. */
  phasesByProject(projectId: number): Observable<Phase[]> {
    return this.apollo.query<any>({
      query: PHASES_BY_PROJECT,
      variables: {projectId},
      fetchPolicy: 'network-only'
    }).pipe(map(res => supprimerTypename(res.data.phasesByProject) ?? []));
  }

  /**
   * Crée la phase, la renomme si elle porte un id, change sa portée si
   * `commune` est renseigné.
   */
  savePhase(phase: Phase): Observable<Phase> {
    const saisie = {id: phase.id, name: phase.name, commune: phase.commune,
      project: phase.project?.id != null ? {id: phase.project.id} : undefined};
    return this.apollo.mutate<any>({
      mutation: SAVE_PHASE,
      variables: {phase: saisie}
    }).pipe(map(res => supprimerTypename(res.data.savePhase)));
  }

  /** Les types et les tâches de la phase sont conservés, sans cette phase. */
  deletePhase(phaseId: number): Observable<ResponseApp> {
    return this.apollo.mutate<any>({
      mutation: DELETE_PHASE,
      variables: {phaseId}
    }).pipe(map(res => supprimerTypename(res.data.deletePhase)));
  }

  ordonnerPhases(phaseIds: number[]): Observable<Phase[]> {
    return this.apollo.mutate<any>({
      mutation: ORDONNER_PHASES,
      variables: {phaseIds}
    }).pipe(map(res => supprimerTypename(res.data.ordonnerPhases) ?? []));
  }

  // ---- phases et statuts du projet ----

  /** Statuts que peut prendre un projet de l'espace de travail. */
  statutsProjet(projectId: number): Observable<Status[]> {
    return this.apollo.query<any>({
      query: STATUTS_PROJET_POUR_PHASES,
      variables: {projectId},
      fetchPolicy: 'network-only'
    }).pipe(map(res => supprimerTypename(res.data.statutsProjetPourPhases) ?? []));
  }

  /** Refusé si le statut désigne déjà une autre phase. */
  lierStatut(phaseId: number, statusId: number): Observable<Phase> {
    return this.apollo.mutate<any>({
      mutation: LIER_STATUT_PHASE,
      variables: {phaseId, statusId}
    }).pipe(map(res => supprimerTypename(res.data.lierStatutPhase)));
  }

  delierStatut(phaseId: number, statusId: number): Observable<Phase> {
    return this.apollo.mutate<any>({
      mutation: DELIER_STATUT_PHASE,
      variables: {phaseId, statusId}
    }).pipe(map(res => supprimerTypename(res.data.delierStatutPhase)));
  }

  // ---- phases des types ----

  /** Phases dans lesquelles le type est utilisé ; liste vide : aucune. */
  setIssueTypePhases(issueTypeId: number, phaseIds: number[]): Observable<IssueType> {
    return this.apollo.mutate<any>({
      mutation: SET_ISSUE_TYPE_PHASES,
      variables: {issueTypeId, phaseIds}
    }).pipe(map(res => supprimerTypename(res.data.setIssueTypePhases)));
  }

  // ---- phase des tâches ----

  /** Types proposables pour une nouvelle sous-tâche, selon la phase courante du projet. */
  typesSousTache(parentIssueId: number): Observable<TypesSousTacheParPhase> {
    return this.apollo.query<any>({
      query: TYPES_SOUS_TACHE_PAR_PHASE,
      variables: {parentIssueId},
      fetchPolicy: 'network-only'
    }).pipe(map(res => supprimerTypename(res.data.typesSousTacheParPhase)));
  }

  /** Phase de la tâche, phases de son type et phase courante de son projet. */
  phaseDeTache(issueId: number): Observable<Issue> {
    return this.apollo.query<any>({
      query: PHASE_DE_TACHE,
      variables: {id: issueId},
      fetchPolicy: 'network-only'
    }).pipe(map(res => supprimerTypename(res.data.findIssueById)));
  }

  /** Reclasse la tâche dans une autre phase de son type. */
  setIssuePhase(issueId: number, phaseId: number | null): Observable<Issue> {
    return this.apollo.mutate<any>({
      mutation: SET_ISSUE_PHASE,
      variables: {issueId, phaseId}
    }).pipe(map(res => supprimerTypename(res.data.setIssuePhase)));
  }
}
