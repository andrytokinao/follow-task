import {gql} from 'apollo-angular';

/**
 * Requêtes GraphQL des phases de projet (schéma `phases.graphqls`).
 *
 * Voir docs/technique/DT-001-phases-projet.html.
 */

const PHASE = `
  id
  name
  commune
  position
`;

const PHASE_STATUTS = `
  ${PHASE}
  statuses { id displayName color }
`;

export const PHASES_BY_PROJECT = gql`
  query phasesByProject($projectId:Int!){
    phasesByProject(projectId:$projectId){
      ${PHASE_STATUTS}
    }
  }
`;

export const STATUTS_PROJET_POUR_PHASES = gql`
  query statutsProjetPourPhases($projectId:Int!){
    statutsProjetPourPhases(projectId:$projectId){
      id
      displayName
      color
    }
  }
`;

export const SAVE_PHASE = gql`
  mutation savePhase($phase:PhaseInput!){
    savePhase(phase:$phase){
      ${PHASE_STATUTS}
    }
  }
`;

export const DELETE_PHASE = gql`
  mutation deletePhase($phaseId:Int!){
    deletePhase(phaseId:$phaseId){
      status
      message
      code
    }
  }
`;

export const ORDONNER_PHASES = gql`
  mutation ordonnerPhases($phaseIds:[Int!]!){
    ordonnerPhases(phaseIds:$phaseIds){
      id
      position
    }
  }
`;

export const LIER_STATUT_PHASE = gql`
  mutation lierStatutPhase($phaseId:Int!,$statusId:Int!){
    lierStatutPhase(phaseId:$phaseId,statusId:$statusId){
      ${PHASE_STATUTS}
    }
  }
`;

export const DELIER_STATUT_PHASE = gql`
  mutation delierStatutPhase($phaseId:Int!,$statusId:Int!){
    delierStatutPhase(phaseId:$phaseId,statusId:$statusId){
      ${PHASE_STATUTS}
    }
  }
`;

export const SET_ISSUE_TYPE_PHASES = gql`
  mutation setIssueTypePhases($issueTypeId:Int!,$phaseIds:[Int!]!){
    setIssueTypePhases(issueTypeId:$issueTypeId,phaseIds:$phaseIds){
      id
      name
      phases { ${PHASE} }
    }
  }
`;

export const TYPES_SOUS_TACHE_PAR_PHASE = gql`
  query typesSousTacheParPhase($parentIssueId:Int!){
    typesSousTacheParPhase(parentIssueId:$parentIssueId){
      phaseCourante { ${PHASE} }
      choix {
        proposee
        phase { ${PHASE} }
        issueType {
          id
          name
          prefix
          level
          color
          project { id name prefix description }
        }
      }
    }
  }
`;

/** Phase d'une tâche, phases possibles (celles de son type) et phase courante de son projet. */
export const PHASE_DE_TACHE = gql`
  query phaseDeTache($id:Int){
    findIssueById(id:$id){
      id
      parent { id }
      phase { ${PHASE} }
      phaseCourante { ${PHASE} }
      issueType { id level phases { ${PHASE} } }
    }
  }
`;

export const SET_ISSUE_PHASE = gql`
  mutation setIssuePhase($issueId:Int!,$phaseId:Int){
    setIssuePhase(issueId:$issueId,phaseId:$phaseId){
      id
      phase { ${PHASE} }
    }
  }
`;
