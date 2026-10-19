import {Injectable} from '@angular/core';
import {Apollo} from "apollo-angular";
import {map, Observable} from "rxjs";
import {DEFINIR_ETAPE_AVANCEMENT, ETAPES_DU_FLUX} from "../type/avancement.operations";
import {EtapeAvancement} from "../type/etape-avancement";

/** Étape d'avancement des statuts : le statut des tâches suit leur planning (DT-007). */
@Injectable({
  providedIn: 'root'
})
export class AvancementService {

  constructor(private apollo: Apollo) {
  }

  /** Étape de chaque statut du flux, par identifiant ; les statuts sans étape sont absents. */
  etapesDuFlux(workFlowId: number): Observable<{ [statusId: number]: EtapeAvancement }> {
    return this.apollo.query<any>({
      query: ETAPES_DU_FLUX,
      variables: {workFlowId},
      fetchPolicy: 'network-only'
    }).pipe(map(res => {
      const etapes: { [statusId: number]: EtapeAvancement } = {};
      (res.data.getWorkFlow?.statuses || [])
        .filter((status: any) => status?.etapeAvancement)
        .forEach((status: any) => etapes[status.id] = status.etapeAvancement);
      return etapes;
    }));
  }

  /** etape null : le statut n'a plus d'étape. */
  definirEtape(statusId: number, etape: EtapeAvancement | null): Observable<EtapeAvancement | null> {
    return this.apollo.mutate<any>({
      mutation: DEFINIR_ETAPE_AVANCEMENT,
      variables: {statusId, etape}
    }).pipe(map(res => res.data.definirEtapeAvancement?.etapeAvancement ?? null));
  }
}
