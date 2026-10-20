import {gql} from "apollo-angular";

const UTILISATEUR = `
  id
  username
  firstName
  lastName
  photo
`;

const ICONE = `
  icone {
    id
    typeIcone
    value
  }
`;

/**
 * Issue affichée dans la popup d'aperçu : ce qu'il faut pour la résumer, sans
 * le flux ni les commentaires que charge GET_ISSUE_BY_ID pour l'édition.
 */
export const APERCU_ISSUE = gql`
  query apercuIssue($issueId:Int){
    getIssueById(issueId: $issueId) {
      id
      issueKey
      summary
      description
      creationDate
      currentCompletionPercent
      elapsedDurationMinutes
      status {
        id
        displayName
        color
        ${ICONE}
      }
      issueType {
        id
        name
        level
        color
        ${ICONE}
      }
      reporter {${UTILISATEUR}}
      assigne {${UTILISATEUR}}
      activeMemberships {
        id
        role
        user {${UTILISATEUR}}
      }
      labels {
        id
        label {
          id
          name
          color
        }
      }
      values {
        id
        date
        customField {
          id
          code
        }
      }
      project {
        id
        name
        prefix
      }
      parent {
        id
        issueKey
        summary
        issueType {
          id
          name
          level
          color
          ${ICONE}
        }
      }
    }
  }
`;

/** Sous-tâches de la popup d'aperçu : une ligne chacune, statut et avancement compris. */
export const APERCU_SOUS_TACHES = gql`
  query apercuSousTaches($parentId:Int){
    loadSubtask(parentId: $parentId){
      id
      issueKey
      summary
      currentCompletionPercent
      status {
        id
        displayName
        color
        etapeAvancement
        ${ICONE}
      }
      issueType {
        id
        name
        level
        color
        ${ICONE}
      }
      assigne {${UTILISATEUR}}
      activeMemberships {
        id
        role
        user {${UTILISATEUR}}
      }
    }
  }
`;
