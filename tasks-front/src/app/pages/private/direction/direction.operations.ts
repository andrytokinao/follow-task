import {gql} from 'apollo-angular';

/**
 * Requêtes GraphQL du cockpit de direction.
 *
 * Elles s'appuient sur les requêtes existantes (`loadSubtask`,
 * `getDocuments`, `getIssuePlanningSummaries`) ; seul `dateDebutTraitement`
 * est propre au cockpit.
 */

const UTILISATEUR = `
  id
  username
  firstName
  lastName
  photo
`;

/**
 * Portefeuille : projets en cours (demandes racines non terminées) avec les
 * chiffres de leur rapport, et la liste des départements pour le filtre.
 */
export const DIRECTION_PROJETS = gql`
  query directionProjets($departement: String) {
    directionDepartements
    directionProjets(departement: $departement) {
      id
      issueKey
      summary
      santeProjet
      rapportProjet {
        departement
        prefixeDepartement
        chefDeProjet
        avancementGlobal
        synthese {
          totalHeures
          heuresPlanifiees
          nombreTaches
          nombreTerminees
          nombreEnRetard
        }
      }
      prochaineEcheance {
        id
        issueKey
        summary
        finPlanifiee
      }
    }
  }
`;

/** Tâches du projet et livrables (fichiers finaux, type DONNE_FILE). */
export const DIRECTION_DETAIL_PROJET = gql`
  query directionDetailProjet($projetId: Int, $typeDocument: String) {
    loadSubtask(parentId: $projetId) {
      id
      issueKey
      summary
      currentCompletionPercent
      elapsedDurationMinutes
      dateDebutTraitement
      assigne { ${UTILISATEUR} }
      activeMemberships {
        id
        role
        user { ${UTILISATEUR} }
      }
    }
    getDocuments(issueId: $projetId, typeDocument: $typeDocument) {
      id
      titre
      creation
      userApp { ${UTILISATEUR} }
      uploadeds { id name }
    }
  }
`;

/** Temps de chaque personne, par tâche. */
export const DIRECTION_TEMPS_PAR_PERSONNE = gql`
  query directionTempsParPersonne($issueIds: [ID!]!) {
    getIssuePlanningSummaries(issueIds: $issueIds) {
      issue { id }
      userStats {
        user { ${UTILISATEUR} }
        spentMinutes
        totalMinutes
      }
    }
  }
`;
