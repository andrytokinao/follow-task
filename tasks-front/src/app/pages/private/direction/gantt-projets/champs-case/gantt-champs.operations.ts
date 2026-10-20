import {gql} from 'apollo-angular';

/**
 * Champs datés d'une case du Gantt : ce que le menu lit et écrit. Les valeurs
 * rendues portent ce que le diagramme lit déjà (`CADRE_GANTT`) : elles
 * remplacent celles de la demande telles quelles.
 */

const CHAMP = `
  id
  name
  type
  code
  valeurUnique
`;

const VALEUR = `
  id
  date
  customField { ${CHAMP} }
`;

/** Champs rattachés à un type de demande : ceux qu'une demande de ce type peut porter. */
export const CHAMPS_DU_TYPE = gql`
  query champsDuTypeGantt($issueTypeId: Int) {
    customFieldsByIssueType(issueTypeId: $issueTypeId) {
      id
      customField { ${CHAMP} }
    }
  }
`;

export const DATER_CHAMP = gql`
  mutation daterChampGantt($value: ValueInput!) {
    saveValue(value: $value) { ${VALEUR} }
  }
`;

export const RETIRER_VALEUR = gql`
  mutation retirerValeurGantt($valueId: Int) {
    deleteValue(valueId: $valueId) { ${VALEUR} }
  }
`;

export const CREER_CHAMP = gql`
  mutation creerChampGantt($customField: CustomFieldImput!) {
    saveCustomField(customField: $customField) { ${CHAMP} }
  }
`;
