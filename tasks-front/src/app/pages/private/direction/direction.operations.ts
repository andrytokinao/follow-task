import {gql} from 'apollo-angular';

/**
 * Requêtes GraphQL du cockpit de direction.
 *
 * Le détail des tâches s'appuie sur la requête existante `loadSubtask` ;
 * `dateDebutTraitement`, `nombreCommentaires` et `nombrePiecesJointes` sont
 * propres au cockpit.
 */

const UTILISATEUR = `
  id
  username
  firstName
  lastName
  photo
`;

/**
 * Départements (onglets) et projets en cours de toute la société. Statut et
 * assignés du projet ; `project`, `parent` et `reporter` servent, comme pour les
 * tâches, au composant des assignés (`app-assign-field`).
 */
export const DIRECTION_PROJETS = gql`
  query directionProjets {
    directionDepartements
    directionProjets {
      id
      issueKey
      summary
      status { id displayName color }
      project { id prefix }
      parent { id }
      reporter { id }
      assigne { ${UTILISATEUR} }
      activeMemberships {
        id
        role
        user { ${UTILISATEUR} }
      }
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
 * nombre de commentaires et de pièces jointes. `project`, `parent` et `reporter` servent au
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
      nombrePiecesJointes
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

/**
 * Diagramme de Gantt d'un projet : pour chaque tâche, ses séances de planning
 * (`realisations`) et son avancement. Les assignés ne sont pas chargés : la
 * barre porte l'intervenant de chaque séance.
 */
export const DIRECTION_GANTT_PROJET = gql`
  query directionGanttProjet($projetId: Int) {
    loadSubtask(parentId: $projetId) {
      id
      issueKey
      summary
      currentCompletionPercent
      elapsedDurationMinutes
      status { id displayName color }
      dateDemarrage
      deadline
      realisations {
        id
        titre
        debut
        fin
        avancement
        etat
        intervenant { ${UTILISATEUR} }
      }
      dependances {
        id
        type
        libelle
        destinationId
      }
    }
  }
`;

/** Ce que le Gantt lit d'une demande, projet ou tâche : son cadre (démarrage → deadline) et ses champs. */
const CADRE_GANTT = `
  id
  issueKey
  summary
  issueType { id name }
  phase { id name position }
  currentCompletionPercent
  status { id displayName color }
  dateDemarrage
  deadline
  assigne { ${UTILISATEUR} }
  activeMemberships {
    id
    role
    user { ${UTILISATEUR} }
  }
  values {
    id
    date
    customField { id name type code }
  }
`;

/**
 * Gantt de direction : tous les projets en cours et leurs tâches, avec leurs
 * dates. Les séances de planning sont chargées à part par `searchEvents`.
 */
export const DIRECTION_GANTT_PROJETS = gql`
  query directionGanttProjets {
    directionDepartements
    directionProjets {
      ${CADRE_GANTT}
      phaseCourante { id name }
      rapportProjet {
        departement
        prefixeDepartement
        avancementGlobal
        synthese {
          nombreTaches
          nombreEnRetard
        }
      }
      children {
        ${CADRE_GANTT}
      }
    }
  }
`;

/**
 * Situation du jour (DT-005) : fiabilité, chiffres des projets, et ce que fait
 * chaque ouvrier maintenant. Les départements servent aux onglets.
 */
export const SITUATION_DIRECTION = gql`
  query situationDirection($departement: String) {
    directionDepartements
    situationDirection(departement: $departement) {
      instant
      fiabilite {
        ouvriers
        planningAJour
        enHoraires
        remplissageJour
        remplissageVeille
        part
        niveau
      }
      chiffres {
        enCours
        avancementMoyen
        tachesEnRetard
        tachesBloquees
      }
      aTraiter {
        id
        cle
        titre
        departement
        prefixeDepartement
        avancement
        tachesEnRetard
        tachesBloquees
      }
      personnes {
        personne { ${UTILISATEUR} }
        departement
        etat
        activite {
          id
          titre
          debut
          fin
          etat
          avancement
          cleTache
          tache
          cleProjet
          projet
          prefixeDepartement
        }
        rienDepuis
        minutesAttendues
        minutesCouvertes
      }
    }
  }
`;
