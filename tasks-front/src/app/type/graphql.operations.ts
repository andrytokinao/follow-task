import {Apollo, gql} from "apollo-angular";

export type Maybe<T> = T | null;

const ADD_USER = gql`
  mutation saveUser($userApp:UserAppInput) {
    saveUser(userApp: $userApp) {
      id
      username
      firstName
      lastName
      cin
    }
  }
`;
const ALL_USERS = gql`
  query{
    allUsers{
      id, username, firstName, lastName,contact,email,adress,cin,photo
    }
  }
`;
const GET_USER = gql`
  query getUser($username: String!) {
    getUser(username: $username) {
      id
      username
      lastName
      firstName
      groupes {
        id
        groupe {
          name
          id
          members {
            roles {
              id
              name
            }
          }
        }
      }
    }
  }
`;

const SAVE_ISSUE = gql`
  mutation saveIssue($issue:IssueInput) {
    saveIssue(issue: $issue) {
      id
      summary
      description
      issueKey
      assigne {
        id
        username
        firstName
        username
        photo
      }
      status {
        id
        displayName
        iconeFile
      }
      reporter {
        id
        firstName
        lastName
        photo
      }
    }
  }
`;
const ADD_COMMENT = gql`
  mutation addComment($comment:CommentInput) {
    addComment(comment: $comment) {
      id
      text
      date
      issue {
        id
      }
      user {
        id
        username
        lastName
        firstName
        photo
      }
    }
  }
`;
const ALL_ISSUE = gql`
  query allIssues {
    allIssue {
      id
      summary
      description
      issueKey
      assigne {
        id
        username
        firstName
        username
        photo
      }
      status {
        id
        displayName
        iconeFile
      }
      reporter {
        id
        firstName
        lastName
        photo
      }
    }
  }
`;
const  ALL_COMMENT = gql`
  query allComment ($issueId:Int!) {
    allComment(issueId: $issueId){
      id
      text
      user {
        id
        username
        lastName
        firstName
        photo
      }
      issue {
        id
      }

    }
  }
`;
const  GET_VALUES = gql`
  query getValues ($issueId:Int!) {
    getValues(issueId: $issueId){
      id
      string
      date
      numeric
      issue {
        id
      }
      user {
        id
        username
        lastName
        firstName
        photo
      }
      customField {
        id
        type
        name
      }
      issue {
        id
      }

    }
  }
`;
const  SAVE_VALUE = gql`
  mutation saveValue ($value:ValueInput!) {
    saveValue(value: $value){
      id
      string
      date
      numeric
      text
      issue {
        id
      }
      user {
        id
        username
        lastName
        firstName
        photo
      }
      customField {
        id
        type
        name
      }
      issue {
        id
      }

    }
  }
`;
const  GET_ISSUE_BY_ASSIGN = gql`
  query getByAssign ($assignId:String!) {
     findIssueByUserId(id: $assignId){
      id
      summary
      summary
      assigne {
        id
        username
        firstName
        username
      }
       reporter {
         id
       }
       status {
         id
         displayName
         iconeFile
       }
    }
  }
`;

const  ALL_STATUS = gql`
  query allStatus {
    findAllStatus{
      id
      displayName
      iconeFile
      }
    }
`;

const  LOAD_GROUPE_MEMBER = gql`
  query loadGroupeMember($userId:String!) {
    loadGroupeMember(userId: $userId){
      id
      groupe {
        id
        name
      }
      role
    }
  }
`;
const ALL_CUSTOMFIELD = gql`
  query allCustomField ($issueId:Int!) {
    allCustomField(issueId:$issueId){
      id
      name
      type
    }
  }
`;
export {
  supprimerTypename,
  ADD_USER,
  GET_USER,
  ALL_USERS,
  SAVE_ISSUE,
  GET_ISSUE_BY_ASSIGN,
  ALL_ISSUE,
  ALL_STATUS,
  ADD_COMMENT,
  ALL_COMMENT,
  GET_VALUES,
  ALL_CUSTOMFIELD,
  SAVE_VALUE,
  LOAD_GROUPE_MEMBER

}
function  supprimerTypename<T>(objet: T): T {
  if (!objet || typeof objet !== 'object') {
    return objet;
  }
  if (Array.isArray(objet)) {
    return objet.map((item) => supprimerTypename(item)) as T;
  }
  const nouvelObjet: any = {};
  for (const prop in objet) {
    if (objet.hasOwnProperty(prop) && prop !== '__typename') {
      nouvelObjet[prop] = supprimerTypename(objet[prop]);
    }
  }
  return nouvelObjet as T;
}
