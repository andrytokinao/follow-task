import {gql} from 'apollo-angular';

/**
 * Requêtes GraphQL du cockpit de direction.
 *
 * Le détail des tâches s'appuie sur les requêtes existantes (`loadSubtask`,
 * `getIssuePlanningSummaries`) ; seul `dateDebutTraitement` est propre au
 * cockpit.
 */

const UTILISATEUR = `
  id
  username
  firstName
  lastName
  photo
`;

/** Départements (onglets) et projets en cours de toute la société. */
export const DIRECTION_PROJETS = gql`
  query directionProjets {
    directionDepartements
    directionProjets {
      id
      issueKey
      summary
      rapportProjet {
        departement
        prefixeDepartement
        avancementGlobal
        synthese {
          totalHeures
          nombreTaches
          nombreEnRetard
        }
      }
    }
  }
`;

/** Tâches d'un projet : avancement, personnes, temps passé, premier traitement. */
export const DIRECTION_TACHES_PROJET = gql`
  query directionTachesProjet($projetId: Int) {
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
