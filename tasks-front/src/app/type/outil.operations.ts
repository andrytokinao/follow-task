import {gql} from "apollo-angular";

/* Menu Outils (DT-019), schéma outils.graphqls. */

const AUTEUR = `auteur{ id firstName lastName photo }`;

const CHAMPS_DOSSIER = `
  id nom typeOutil portee parentId espaceNom dateCreation modifiable
  ${AUTEUR}
`;

const CHAMPS_OUTIL = `
  id titre description typeOutil portee dossierId chemin url version espaceNom
  dateCreation dateModification modifiable
  ${AUTEUR}
  fichiers{ id nom typeMime taille dateAjout supprimable ${AUTEUR} }
`;

export const CONTENU_DOSSIER_OUTIL = gql`
  query contenuDossierOutil($espaceId:Int!,$typeOutil:TypeOutil!,$dossierId:Int){
    contenuDossierOutil(espaceId:$espaceId,typeOutil:$typeOutil,dossierId:$dossierId){
      typeOutil
      peutCreerDossier
      dossier{ ${CHAMPS_DOSSIER} }
      chemin{ ${CHAMPS_DOSSIER} }
      dossiers{ ${CHAMPS_DOSSIER} }
      outils{ ${CHAMPS_OUTIL} }
    }
  }
`;

export const RECHERCHER_OUTILS = gql`
  query rechercherOutils($espaceId:Int!,$texte:String!){
    rechercherOutils(espaceId:$espaceId,texte:$texte){ ${CHAMPS_OUTIL} }
  }
`;

export const OUTIL = gql`
  query outil($espaceId:Int!,$id:Int!){
    outil(espaceId:$espaceId,id:$id){ ${CHAMPS_OUTIL} }
  }
`;

export const REGLES_FICHIERS_OUTIL = gql`
  query reglesFichiersOutil{
    reglesFichiersOutil{ typeOutil extensions tailleMax }
  }
`;

export const ENREGISTRER_DOSSIER_OUTIL = gql`
  mutation enregistrerDossierOutil($espaceId:Int!,$saisie:DossierOutilSaisie!){
    enregistrerDossierOutil(espaceId:$espaceId,saisie:$saisie){ ${CHAMPS_DOSSIER} }
  }
`;

export const SUPPRIMER_DOSSIER_OUTIL = gql`
  mutation supprimerDossierOutil($espaceId:Int!,$id:Int!){
    supprimerDossierOutil(espaceId:$espaceId,id:$id)
  }
`;

export const ENREGISTRER_OUTIL = gql`
  mutation enregistrerOutil($espaceId:Int!,$saisie:OutilSaisie!){
    enregistrerOutil(espaceId:$espaceId,saisie:$saisie){ ${CHAMPS_OUTIL} }
  }
`;

export const SUPPRIMER_OUTIL = gql`
  mutation supprimerOutil($espaceId:Int!,$id:Int!){
    supprimerOutil(espaceId:$espaceId,id:$id)
  }
`;

export const SUPPRIMER_FICHIER_OUTIL = gql`
  mutation supprimerFichierOutil($espaceId:Int!,$id:Int!){
    supprimerFichierOutil(espaceId:$espaceId,id:$id)
  }
`;
