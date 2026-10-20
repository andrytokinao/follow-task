import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {combineLatest, Observable, of} from 'rxjs';
import {catchError, filter, map, shareReplay, take} from 'rxjs/operators';
import {AuthService} from '../../../../../services/auth.service';
import {UserService} from '../../../../../services/user.service';
import {CustomField, CustomFieldValue} from '../../../../../type/issue';
import {CHAMPS_DU_TYPE, CREER_CHAMP, DATER_CHAMP, RETIRER_VALEUR} from './gantt-champs.operations';

const TYPE_DATE = 'Date';

/** Rôles d'un espace qui peuvent y créer un champ daté. */
const ROLES_CREATION = ['ADMIN', 'PROJECT_MANAGER'];

/**
 * Lecture et écriture des champs datés depuis une case du Gantt. Les champs
 * d'un type sont demandés une fois ; créer un champ les fait redemander.
 */
@Injectable({providedIn: 'root'})
export class GanttChampsService {

  private readonly champsParType = new Map<number, Observable<CustomField[]>>();
  private readonly droitsParEspace = new Map<string, Observable<boolean>>();

  constructor(private apollo: Apollo,
              private authService: AuthService,
              private userService: UserService) {
  }

  /** Champs de type Date qu'une demande de ce type peut porter. */
  champsDates(issueTypeId: number): Observable<CustomField[]> {
    let champs = this.champsParType.get(issueTypeId);
    if (!champs) {
      champs = this.apollo.query<any>({
        query: CHAMPS_DU_TYPE,
        variables: {issueTypeId},
        fetchPolicy: 'network-only'
      }).pipe(
        map(res => (res.data?.customFieldsByIssueType ?? [])
          .map((using: any) => using.customField as CustomField)
          .filter((champ: CustomField | null) => champ?.type === TYPE_DATE)),
        shareReplay(1));
      this.champsParType.set(issueTypeId, champs);
    }
    return champs;
  }

  /** Ajoute une date au champ ; rend toutes les valeurs de la demande. */
  dater(issueId: number, champ: CustomField, jour: string): Observable<CustomFieldValue[]> {
    return this.apollo.mutate<any>({
      mutation: DATER_CHAMP,
      variables: {value: {customField: {id: champ.id, type: champ.type}, issue: {id: issueId}, date: jour}}
    }).pipe(map(res => res.data?.saveValue ?? []));
  }

  /** Retire une valeur ; rend celles qui restent à la demande. */
  retirer(valueId: number): Observable<CustomFieldValue[]> {
    return this.apollo.mutate<any>({
      mutation: RETIRER_VALEUR,
      variables: {valueId}
    }).pipe(map(res => res.data?.deleteValue ?? []));
  }

  /**
   * Nouveau champ daté pour tout l'espace de travail : rattaché d'office à
   * tous ses types (portée PROJET), il est aussitôt proposé à toutes les cases.
   */
  creer(projectId: number, nom: string, valeurUnique: boolean): Observable<CustomField> {
    return this.apollo.mutate<any>({
      mutation: CREER_CHAMP,
      variables: {customField: {name: nom, type: TYPE_DATE, portee: 'PROJET', valeurUnique, project: {id: projectId}}}
    }).pipe(map(res => {
      this.champsParType.clear();
      return res.data?.saveCustomField;
    }));
  }

  /** Administrateur ou chef de projet de l'espace, ou accès à tout. */
  peutCreer(prefixe: string): Observable<boolean> {
    let droit = this.droitsParEspace.get(prefixe);
    if (!droit) {
      droit = combineLatest([
        this.authService.profile$.pipe(filter(profile => !!profile), take(1)),
        this.authService.connectedUser$.pipe(filter(user => !!user), take(1)),
        this.userService.getUserForProjectAndRole(prefixe, ROLES_CREATION)
      ]).pipe(
        map(([profile, moi, responsables]) => (profile.permissions ?? []).includes('CAN_ACCESS_ALL')
          || responsables.some(r => r.id === moi!.id)),
        catchError(() => of(false)),
        shareReplay(1));
      this.droitsParEspace.set(prefixe, droit);
    }
    return droit;
  }
}
