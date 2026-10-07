import {gql} from 'apollo-angular';

/**
 * Requêtes GraphQL du cockpit de direction.
 *
 * Le détail des tâches s'appuie sur la requête existante `loadSubtask` ;
 * `dateDebutTraitement` et `nombreCommentaires` sont propres au cockpit.
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

/**
 * Tâches d'un projet : avancement, assignés, temps passé, premier traitement,
 * nombre de commentaires. `project`, `parent` et `reporter` servent au
 * composant des assignés (`app-assign-field`) pour juger des droits.
 */
export const DIRECTION_TACHES_PROJET = gql`
  query directionTachesProjet($projetId: Int) {
    loadSubtask(parentId: $projetId) {
      id
      issueKey
      summary
      currentCompletionPercent
      elapsedDurationMinutes
      dateDebutTraitement
      nombreCommentaires
      project { id prefix }
      parent { id }
      reporter { id }
      assigne { ${UTILISATEUR} }
      activeMemberships {
        id
        role
        user { ${UTILISATEUR} }
      }
    }
  }
`;
