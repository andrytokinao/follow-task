import {gql} from "apollo-angular";

/** Étape d'avancement des statuts d'un flux (DT-007). */
export const ETAPES_DU_FLUX = gql`
  query etapesDuFlux($workFlowId:Int){
    getWorkFlow(workFlowId:$workFlowId){
      id
      statuses{
        id
        etapeAvancement
      }
    }
  }
`;

export const DEFINIR_ETAPE_AVANCEMENT = gql`
  mutation definirEtapeAvancement($statusId:Int!,$etape:EtapeAvancement){
    definirEtapeAvancement(statusId:$statusId,etape:$etape){
      id
      etapeAvancement
    }
  }
`;
