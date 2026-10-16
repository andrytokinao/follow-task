import {gql} from 'apollo-angular';

/**
 * Rappels de planning (schéma `rappel-planning.graphqls`) : calculés par le
 * serveur à chaque demande, affichés en toast, jamais enregistrés.
 *
 * Voir docs/technique/DT-004-rappels-planning.html.
 */

export type GraviteRappel = 'INFO' | 'ATTENTION' | 'ALERTE';

export interface RappelPlanning {
  /** Stable tant que le trou est le même : sert à ne pas répéter un rappel. */
  cle: string;
  gravite: GraviteRappel;
  titre: string;
  message: string;
  /** Vrai : bandeau sans fermeture tant que le serveur le renvoie, au lieu d'un toast. */
  persistant: boolean;
}

export const MES_RAPPELS_PLANNING = gql`
  query mesRappelsPlanning {
    mesRappelsPlanning {
      cle
      gravite
      titre
      message
      persistant
    }
  }
`;
