import {ParamMap} from "@angular/router";
export interface Filter {
  name:String,
  description?:String,
  user:User,
  issueSearchCriteria:IssueSearchCriteriaInput
}
export interface IssueSearchCriteriaInput {
  key?: string;
  summary?: string;
  dateFrom?: string;  // Utilisation de string au lieu de Date
  dateTo?: string;    // Utilisation de string au lieu de Date
  statusIds?: number[];
  issueTypeIds?: number[];
  issueTypeLevels?:string[];
  assigneUsernames?: string[];
  customFieldStringValues?: CustomFieldStringValues[];
  customFieldDateValues?: CustomFieldDateValues[];
  customFieldDateValueFrom?: CustomFieldDateValueFrom[];
  customFieldDateValueTo?: CustomFieldDateValueTo[];
  customFieldUserIds?: CustomFieldUserIds[];
  customFieldIssueIds?: CustomFieldIssueIds[];
  customFieldTextValues?: CustomFieldTextValues[];
}

export interface CustomFieldStringValues {
  customFieldId?: number;
  values?: string[];
}

export interface CustomFieldDateValues {
  customFieldId?: number;
  values?: string[];  // Changer `Date[]` en `string[]`
}

export interface CustomFieldDateValueFrom {
  customFieldId?: number;
  value?: string;  // Changer `Date` en `string`
}

export interface CustomFieldDateValueTo {
  customFieldId?: number;
  value?: string;  // Changer `Date` en `string`
}

export interface CustomFieldUserIds {
  customFieldId?: number;
  userIds?: string[];
}

export interface CustomFieldIssueIds {
  customFieldId?: number;
  issueIds?: number[];
}

export interface CustomFieldTextValues {
  customFieldId?: number;
  textValues?: string[];
}

// Conversion en paramètres d'URL
import { HttpParams } from '@angular/common/http';
import {User} from "./issue";

export function toQueryParams(criteria: IssueSearchCriteriaInput): { [key: string]: any } {
  const params: { [key: string]: any } = {};

  for (const key in criteria) {
    if (criteria[key] !== undefined && criteria[key] !== null) {
      if (Array.isArray(criteria[key])) {
        criteria[key].forEach((value, index) => {
          let values=[];
          if (typeof value === 'object') {
            for (const objKey in value) {
              if (value[objKey] !== undefined && value[objKey] !== null) {
                params[`${key}_${index}_${objKey}`] = value[objKey];
              }
            }
          } else {
            values = (params[`${key}[]`])?(params[`${key}[]`]) : [];
            values.push(value);
            params[`${key}[]`] = values;
          }
        });
      } else {
        params[key] = criteria[key];
      }
    }
  }

  return params;
}


export function fromUrlParams(paramMap: ParamMap): IssueSearchCriteriaInput {
  const criteria: IssueSearchCriteriaInput = {};

  paramMap.keys.forEach(key => {
    const values = paramMap.getAll(key);
    if (key.endsWith('[]')) {
      const cleanKey = key.slice(0, -2);
      criteria[cleanKey] = values;
    } else if (key.includes('_')) {
      const [baseKey, indexStr] = key.split('_');
      const index = parseInt(indexStr, 10);

      if (!criteria[baseKey]) {
        criteria[baseKey] = [];
      }

      if (!criteria[baseKey][index]) {
        criteria[baseKey][index] = {};
      }

      criteria[baseKey][index][key] = values;
    } else {
      criteria[key] = values.length > 1 ? values : values[0];
    }
  });

  return criteria;
}

