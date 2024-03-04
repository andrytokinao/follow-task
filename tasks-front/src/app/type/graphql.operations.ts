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
const ALL_USER = gql`
  query{
    allUsers{
      id, username, firstName, lastName,contact,email,adress,cin
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
        name
      }
    }
  }
`;

const ADD_ISSUE = gql`
  mutation saveIssue($issue:IssueInput) {
    saveIssue(issue: $issue) {
      id
      summary
      description
      assigne {
        id
        username
        lastName
        firstName
      }
    }
  }
`;
const ALL_ISSUE = gql`
  query allIssues {
    allIssue {
      id
      summary
      summary
      assigne {
        id
        username
        firstName
        username
      }
    }
  }
`;
const  GET_ISSUE_BY_ASSIGN = gql`
  query getByAssign ($assignId:Int!) {
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
    }
  }
`;
export {
  ADD_USER,
  GET_USER,
  ALL_USER,
  ADD_ISSUE,
  GET_ISSUE_BY_ASSIGN
}
