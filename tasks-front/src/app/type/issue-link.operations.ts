import {gql} from "apollo-angular";

/** Champs d'une tâche liée : de quoi l'afficher, et la situer dans son département. */
const ISSUE_LINK_FIELDS = `
  id
  type
  outwardLabel
  inwardLabel
  mode
  lagDays
  createdAt
  source {
    id
    issueKey
    summary
    status { id displayName color style }
    project { id name prefix }
  }
  destination {
    id
    issueKey
    summary
    status { id displayName color style }
    project { id name prefix }
  }
`;

export const OUTGOING_ISSUE_LINKS = gql`
  query outgoingIssueLinks($issueId: Int!) {
    outgoingIssueLinks(issueId: $issueId) { ${ISSUE_LINK_FIELDS} }
  }
`;

export const INCOMING_ISSUE_LINKS = gql`
  query incomingIssueLinks($issueId: Int!) {
    incomingIssueLinks(issueId: $issueId) { ${ISSUE_LINK_FIELDS} }
  }
`;

export const LINK_ISSUES = gql`
  mutation linkIssues($sourceId: Int!, $destinationId: Int!, $type: LinkType!, $mode: DependencyMode, $lagDays: Int) {
    linkIssues(sourceId: $sourceId, destinationId: $destinationId, type: $type, mode: $mode, lagDays: $lagDays) { ${ISSUE_LINK_FIELDS} }
  }
`;

export const UPDATE_ISSUE_LINK = gql`
  mutation updateIssueLink($linkId: Int!, $mode: DependencyMode, $lagDays: Int) {
    updateIssueLink(linkId: $linkId, mode: $mode, lagDays: $lagDays) { ${ISSUE_LINK_FIELDS} }
  }
`;

export const UNLINK_ISSUES = gql`
  mutation unlinkIssues($linkId: Int!) {
    unlinkIssues(linkId: $linkId)
  }
`;
