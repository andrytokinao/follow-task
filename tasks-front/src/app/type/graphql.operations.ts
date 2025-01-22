import {Apollo, gql} from "apollo-angular";

export let SAVE_CUSTOM_FILTER = gql`
  mutation saveCustomFilter($customFilter:IssueFilterInput) {
    saveCustomFilter(customFilter:$customFilter) {
      id
      name
      description
      criteria {
        key
        summary
        projectId
        assigneUsernames
        customFieldDateValueFrom {
          value
          customFieldId
        }
        customFieldDateValues {
          values
          customFieldId
        }
        customFieldStringValues {
          customFieldId
          values
        }
        customFieldIssueIds {
          issueIds
          customFieldId
        }
        dateFrom
        dateTo
        customFieldUserIds {
          customFieldId
          userIds
        }
        customFieldTextValues {
          customFieldId
          textValues
        }
        projectPrefix

      }
      user {
        id
        username
      }
    }
  }
`;


export type Maybe<T> = T | null;

const SAVE_USER = gql`
  mutation saveUser($userApp:UserAppInput) {
    saveUser(userApp: $userApp) {
      id
      username
      firstName
      lastName
      cin
      photo
      address
      cin
      email
    }
  }
`;
const INIT_USER = gql`
  mutation initUser($userApp:UserAppInput) {
    initUser(userApp: $userApp) {
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
      id,
      username,
      firstName,
      password,
      lastName,
      contact,
      email,
      address,
      cin,
      photo
    }
  }
`;
const GET_USER = gql`
  query getUser($username: String!) {
    getUser(username: $username) {
      id
      username
      password
      lastName
      firstName
      contact
      cin
      photo
      address
      email
      groupes {
        id
        groupe {
          name
          id
          members {
            roles
            id
            groupe {
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
        icone {
          id
          typeIcone
          value
        }
      }
      reporter {
        id
        firstName
        lastName
        photo
      }
      issueType {
        id
        name
        icone {
          id
          typeIcone
          value
        }
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
      creationDate
      parent {
        id
        summary
      }
      values {
        id
        values
        text
        date
        numeric
        issue {
          id
        }
        customField {
          id
          type
          options
          name
          configDisplay
        }

        user {
          id
          username
          photo
          firstName
          lastName
        }
      }
      issueType {
        id
        name
        icone {
          id
          typeIcone
          value
        }
        curentWorkFlow {
          id
          name
          statuses {
            id
            displayName
            icone {
              id
              typeIcone
              value
            }
          }
        }
        level
      }
      assigne {
        id
        username
        firstName
        lastName
        username
        photo
      }
      status {
        id
        displayName
        icone {
          id
          typeIcone
          value
        }
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
      date
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
      values
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
        configDisplay
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
       issueType {
         id
         name
         icone {
           id
           value
           typeIcone
         }
       }
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
         icone {
           id
           typeIcone
           value
         }
       }
    }
  }
`;

const  ALL_STATUS = gql`
  query allStatus {
    findAllStatus{
      id
      displayName
      icone {
        id
        typeIcone
        value
      }
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
      roles
    }
  }
`;
const ALL_CUSTOMFIELD = gql`
  query allCustomField  {
    allCustomField{
      id
      name
      type
    }
  }
`;
const ALL_CUSTOMFIELD_BY_ISSUE = gql`
  query allCustomField ($issueId:Int!) {
    allCustomFieldByIssue(issueId:$issueId){
      id
      name
      type
    }
  }
`;
const SAVE_CONFIG = gql`
  mutation saveConfig($configEntry:ConfigEntryInput) {
    saveConfig( configEntry: $configEntry) {
      id
      dateEntry
      version
      typeEntry
    }
  }
`;
const GET_CONFIG = gql`
  query allCustomField ($typeEntry:String!) {
    getConfig(typeEntry:$typeEntry){
      id
      acive
      configDirectory
      dataDirectory
      mediaDirectory
      workDirectory
    }
  }
`;
const ALL_CONFIG = gql`
  query allConfig  {
    allConfig {
      id
      acive
      version
    }
  }
`;

const  SAVE_PROJECT = gql`
  mutation createProjectOrSave ($project:ProjectInput!) {
    createProjectOrSave(project: $project){
      id
      name
      prefix
      issueTypes {
        id
        name
        prefix
        icone {
          id
          value
          typeIcone
        }
        curentWorkFlow {
          id
          name
          statuses {
            id
            displayName
            icone {
              id
              typeIcone
              value
            }
          }
        }
      }

    }
  }
`;

const  SAVE_ISSUE_TYPE = gql`
  mutation saveIssueType ($issueType:IssueTypeInput!) {
    saveIssueType(issueType: $issueType){
      id
      name
      prefix
      icone {
        id
        value
        typeIcone
      }
      curentWorkFlow {
        id
        name
        statuses {
          id
          displayName
          icone {
            id
            typeIcone
            value
          }
        }
      }

    }
  }
`;
const  GET_ISSUE_TYPE = gql`
   query ($issueTypeId:Int!) {
    getIssueType(issueTypeId: $issueTypeId){
      id
      name
      prefix
      level
      curentWorkFlow {
        id
        name
        statuses {
          id
          displayName
          icone {
            id
            typeIcone
            value
          }
        }
      }
      parent {
        id
        prefix
        name
        level
        icone {
          id
          value
          typeIcone
        }
      }

    }
  }
`;
const ALL_ISSUE_TYPE =gql`
  query ($projectId:Int!) {
    allIssueType(projectId: $projectId){
      id
      name
      prefix
      project {
        id
        name
        prefix
      }
      parent {
        id
        prefix
        name
      }
      level
      usingCustomFields {
        id
        issueType {
          id
          name
          icone {
            id
            value
            typeIcone
          }
          prefix
          level
        }
        customField {
          id
          name
          type
        }
      }
      curentWorkFlow {
        id
        name
        statuses {
          id
          displayName
          icone {
            id
            typeIcone
            value
          }
        }
      }
      icone {
        id
        value
        typeIcone
      }

    }
  }
`;
const SAVE_WORK_FLOW = gql`
    mutation saveWorkFlow($workFlow:WorkFlowInput) {
      saveWorkFlow(workFlow: $workFlow) {
        id
        name
        statuses {
          id
          displayName
          icone {
            id
            typeIcone
            value
          }
        }
        crossingStates {
          id
          name
          description
          credential {
            id
            name
          }
        }
        active
        issueTypes {
          id
          name
        }
        project {
          id
          name
        }
      }
    }
`
const GET_WORK_FLOW = gql`
  query getWorkFlow($workFlowId:Int) {
    getWorkFlow(workFlowId: $workFlowId) {
      id
      name
      statuses {
        id
        displayName
        icone {
          id
          typeIcone
          value
        }
      }
      crossingStates {
        id
        name
        description
        credential {
          id
          name
        }
      }
      active
      issueTypes {
        id
        name
      }
      project {
        id
        name
      }
    }
  }
`

const WORK_FLOWS_BY_PROJECT = gql`
  query workFlowsByProject($projectId:Int) {
    workFlowsByProject(projectId: $projectId) {
      id
      name
      statuses {
        id
        displayName
        icone {
          id
          typeIcone
          value
        }
      }
      active
      project {
        id
        name
      }
    }
  }
`

const  AFFECT_WORKFLOW = gql`
  mutation affectWorkFlow ($issueType:IssueTypeInput!) {
    affectWorkFlow(issueType: $issueType){
      id
      name
      statuses {
        id
        displayName
        icone {
          id
          typeIcone
          value
        }
      }

    }
  }
`;
const  ADD_STATUS = gql`
  mutation addStatus ($status:StatusInput ,$workFlow:WorkFlowInput) {
    addStatus(workFlow: $workFlow, status: $status){
      id
      name
      statuses {
        id
        displayName
        icone {
          id
          typeIcone
          value
        }
      }
      crossingStates {
        id
        name
        description
        credential {
          id
          name
        }
      }
      active
      issueTypes {
        id
        name
      }
      project {
        id
        name
      }
    }
  }
`;
const ALL_PROJECT = gql`
  query allProjects  {
    allProjects {
      id
      name
      prefix
      description
      statusConfig
    }
  }
`;

const GET_PROJECT = gql`
  query getProject($prefix:String)  {
    getProject (prefix:$prefix){
      id
      name
      prefix
      issueTypes {
        id
        name
        prefix
        icone {
          id
          value
          typeIcone
        }
        curentWorkFlow {
          id
          name
          crossingStates {
            id
            name
            description
            credential {
              id
              name
            }
          }
          statuses {
            id
            displayName
            icone {
              id
              typeIcone
              value
            }
          }
        }
        usingCustomFields {
          id
          issueType {
            id
          }
          customField {
            id
            type
            name
          }
        }
        parent {
          id
          name
          icone {
            id
            value
            typeIcone
          }
        }

      },
      workFlows {
        id
        name
        statuses {
          id
          displayName
          icone {
            id
            typeIcone
            value
          }
        }
        issueTypes {
          id
          name
          icone {
            id
            value
            typeIcone
          }
        }
      }
      domainActivity {
        id
        name
        description
        image
      }
    }
  }
`;
const GET_ISSUE_TYPE_BY_ID = gql`
 query getIssueTypeById($issueTypeId:Int){
   getIssueTypeById(issueTypeId: $issueTypeId){
     id
     name
     level
     prefix
     usingCustomFields {
       id
       customField {
         id
         name
         type
       }
       issueType {
         id
         name
       }
     }
     curentWorkFlow {
       name
       id
       crossingStates {
         id
         name
       }
     }
     project {
       id
       name
     }
     icone {
       id
       typeIcone
       value
     }
     parent {
       id
       name
       icone {
         id
         typeIcone
         value
       }
     }
     children {
       id
       name
       icone {
         id
         typeIcone
         value
       }
     }
     curentWorkFlow {
       id
       name
       project {
         id
       }
       statuses {
         id
         displayName
         icone {
           id
           value
           typeIcone
         }

       }
     }

   }
 }
`
 const ISSUE_BY_CRITERIA=gql`
   query issueByCriteria($criterias:[CriteriaInput]){
     issueByCriteria(criterias: $criterias){
       id
       issueKey
       summary
       comments {
         id
         date
         text
         user {
           id
           username
           lastName
           lastName
           photo
         }
       }
       assigne {
         id
         firstName
         lastName
         username
         photo
       }
       issueType {
         id
         name
         prefix
         icone {
           id
           value
           typeIcone
         }
       }
       reporter {
         id
         photo
         username
         lastName
         firstName
       }
       status {
         id
         displayName
         icone {
           id
           value
           typeIcone
         }
       }
     }
   }
 `
const SEVE_CUSTOM_FIELD = gql`
    mutation saveCustomField($customField:CustomFieldImput!) {
      saveCustomField(customField:$customField) {
        name
        id
        type
        options
        configDisplay
        issueTypes {
          id
          issueType {
            id
          }
          customField {
            id
            type
            name
          }
        }
      }
    }
`

const ALL_CUSTOM_FIELD = gql`
   query allCustomField{
     allCustomField{
       id
       name
       options
       issueTypes {
         id
         issueType {
           id
         }
         customField {
           id
           type
           name
         }
       }
       type
     }
   }
`
const USE_CUSTOM_FIELD = gql`
    mutation useCustomField($usingCustomField:UsingCustomFieldInput!) {
      useCustomField(usingCustomField: $usingCustomField) {
        customField {
          id
          type
          name
        }
        issueType {
          id
          name
          prefix
          icone {
            id
            typeIcone
            value
          }
        }
      }
    }`
const GET_CUSTOM_FIELD = gql `
   query getCustomField($id:Int) {
     getCustomField(id: $id) {
       id
       name
       options
       type
       configDisplay
       issueTypes {
         id
         issueType {
           id
           name
         }
         customField {
           id
         }
       }
     }
   }
`
const UN_USE_CUSTOM_FIELD = gql`
    mutation unUseCustomField($usingCustomField:UsingCustomFieldInput!) {
       unUseCustomField(usingCustomField: $usingCustomField) {
        customField {
          id
          type
          name
        }
        issueType {
          id
          name
          prefix
          icone {
            id
            typeIcone
            value
          }
        }
      }
    }`

const CUSTOM_FIELD_BY_ISSUE_TYPE = gql`
   query customFieldsByIssueType($issueTypeId:Int) {
     customFieldsByIssueType (issueTypeId: $issueTypeId) {
       id
       customField {
         id
         name
         type
       }
       issueType {
         id
         name
       }
     }
   }
`
const AFFECT_ISSUE_TYPE_FOR_PARENT=gql`
  mutation affectIssueTypeForParent($childId:Int,$parrentId:Int){
    affectIssueTypeForParent(childId:$childId,parrentId:$parrentId){
      id
      name
      prefix
      level
      icone {
        id
        value
        typeIcone
      }
      parent {
        id
        name
        icone {
          id
          typeIcone
          value
        }
      }
      children {
        id
        name
        icone {
          id
          value
          typeIcone
        }
      }

    }
  }
`
const REMOVE_ISSUE_TYPE_PARENT=gql`
  mutation removeIssueTypeParent($childId:Int){
    removeIssueTypeParent(childId:$childId){
      id
      name
      prefix
      icone {
        id
        value
        typeIcone
      }
      parent {
        id
        name
        icone {
          id
          typeIcone
          value
        }
      }
      children {
        id
        name
        icone {
          id
          value
          typeIcone
        }
      }

    }
  }
`
const ASSIGNE_TO_USER =  gql `
    mutation assigneToUser($issue:IssueInput) {
      assigneToUser(issue: $issue){
        id
        issueKey
        summary
        creationDate
        description
        status {
          id
          icone {
            id
            typeIcone
            value
          }
        }
        issueType {
          id
          name
          prefix
          icone {
            id
            value
            typeIcone
          }
        }
        reporter {
          id
          username
          lastName
          firstName
          photo
        }
        values {
          id
          numeric
          date
          text
          values
          customField {
            id
            name
            configDisplay
            options
            type
          }
          user {
            id
            username
            lastName
            firstName
          }
          issue {
            id
            issueKey
          }

        }
        assigne {
          id
          username
          lastName
          firstName
          photo
        }
      }
    }
`;

const GET_CONFIG_PROJECT =gql`
  query getConfigProject($projectId:Int){
    getConfigProject(projectId: $projectId){
      id
      configof
      value
    }
  }
`
const SAVE_CONFIG_PROJECT=gql`
    mutation saveOrUpdateConfig($configProject:ConfigProjectInput){
      saveOrUpdateConfig(configProject: $configProject){
        id
        configof
        value
      }
    }
`
const GET_GROUPE_USER_FOR_PROJECT=gql`
  query getGroupeUserForProject($prefix:String){
    getGroupeUserForProject(prefix: $prefix){
      id
      name
      prefix
      members {
        id
        user {
          id
          firstName
          lastName
          username
          photo
        }
        roles
      }
    }
  }
`

const ADD_USER_IN_GROUPE = gql`
 mutation addUserInGroupe($username:String,$groupeId:Int,$roles:[String]) {
    addUserInGroupe(username:$username , groupeId: $groupeId,roles: $roles){
     id
      user {
        id
        firstName
        photo
        lastName
        firstName
      }
      roles
      groupe {
        id
        name
      }
   }
 }
`
const GET_NEXT_KEY = gql`
  query getNextKey($issueTypeId:Int){
    getNextKey(issueTypeId: $issueTypeId)
  }
`
const LIST_ISSUE_TYPE_SUBTASKS = gql`
  query listIssueTypeSubtasks($masterId:Int){
    listIssueTypeSubtasks(masterId: $masterId) {
      id
      name
      prefix
      level
      project {
        id
        name
        prefix
        description
      }
    }
  }
`
const LIST_ISSUE_TYPE_MASTER = gql`
  query listIssueTypeMaster($projectId:Int){
    listIssueTypeMaster(projectId: $projectId){
      id
      name
      prefix
      level
    }
  }
`
const GET_ISSUE = gql`
  query getIssue($issueKey:String){
    getIssue(issueKey: $issueKey ) {
      id
      issueKey
      summary
      description
      encodedPath
      issueType {
        id
        level
        prefix
        name
        icone {
          id
          value
          typeIcone
        }
      }
      assigne {
        id
        username
        firstName
        lastName
        photo
      }
      reporter {
        id
        username
        firstName
        lastName
        photo
      }
    }
  }
`
const LOAD_SUBTASK = gql`
    query loadSubtask($parentId:Int) {
      loadSubtask(parentId: $parentId){
        id
        issueKey
        summary
        creationDate
        description
        status {
          id
          displayName
          icone {
            id
            typeIcone
            value
          }
        }
        issueType {
          id
          name
          prefix
          icone {
            id
            value
            typeIcone
          }
        }
        reporter {
          id
          username
          lastName
          firstName
          photo
        }
        values {
          id
          numeric
          date
          text
          values
          customField {
            id
            name
            configDisplay
            options
            type
          }
          user {
            id
            username
            lastName
            firstName
          }
          issue {
            id
            issueKey
          }

        }
        assigne {
          id
          username
          lastName
          firstName
          photo
        }
        parent {
          id
          summary
        }
      }
    }
`
const LOAD_ISSUE_MASTER_BY_PROJECT = gql`
  query loadIssueMasterByProject($projectId:Int) {
    loadIssueMasterByProject(projectId: $projectId){
      id
      issueKey
      summary
      creationDate
      description
      status {
        id
        displayName
        icone {
          id
          typeIcone
          value
        }
      }
      issueType {
        id
        name
        prefix
        icone {
          id
          value
          typeIcone
        }
      }
      reporter {
        id
        username
        lastName
        firstName
        photo
      }
      values {
        id
        numeric
        date
        text
        values
        customField {
          id
          name
          configDisplay
          options
          type
        }
        user {
          id
          username
          lastName
          firstName
        }
        issue {
          id
          issueKey
        }

      }
      assigne {
        id
        username
        lastName
        firstName
        photo
      }
    }
  }
`
const SEARCH_ISSUES = gql`
  query searchIssues($criteria:IssueSearchCriteriaInput) {
    searchIssues(criteria: $criteria){
      id
      issueKey
      summary
      creationDate
      description
      encodedPath
      status {
        id
        displayName
        icone {
          id
          typeIcone
          value
        }
      }
      issueType {
        id
        name
        icone {
          id
          typeIcone
          value
        }
        curentWorkFlow {
          id
          name
          statuses {
            id
            displayName
            icone {
              id
              typeIcone
              value
            }
          }
        }
        level
      }
      reporter {
        id
        username
        lastName
        firstName
        photo
      }
      values {
        id
        numeric
        date
        text
        values
        customField {
          id
          name
          configDisplay
          options
          type
        }
        user {
          id
          username
          lastName
          firstName
        }
        issue {
          id
          issueKey
        }

      }
      assigne {
        id
        username
        lastName
        firstName
        photo
      }
      parent {
        id
        issueKey
        summary
        issueType {
          id
          name
          icone {
            id
            value
            typeIcone
          }
        }
      }
    }
  }
`
const SAVE_EVENT = gql`
  mutation saveEvent($event:EventInput) {
    saveEvent(event: $event) {
      id
      title
      description
      allDay
      customColor
      customStyle
      location
      reminderTime
      reminderOffset
      start
      end
      user {
        id
        firstName
        lastName
        firstName
      }
      issue {
        id
        issueKey
        summary
      }
    }
  }
`
const ALL_EVENT_TYPE = gql`
  query allEventType{
   allEventType{
    id
     name
     description
     defaultColor
     defaultStyle
   }
  }
`
const SEARCH_EVENTS  = gql`
  query searchEvents($criteria:EventSearchCriteriaInput){
    searchEvents(criteria:$criteria){
      id
      title
      location
      start
      end
      allDay
      reminderOffset
      reminderTime
      customColor
      description
      eventType {
        id
        name
        defaultStyle
        defaultColor
      }
      issue {
        id
        summary
        issueKey
      }
      user {
        id
        username
        firstName
        lastName
        photo
      }

    }
  }
`
const DELETE_EVENT_TYPE = gql`
  mutation deleteEvent($eventId:Int!) {
    deleteEvent(eventId:$eventId) {
      id
    }
  }
`
const EVENT_BY_ID=gql`
    query getByEventId($eventId:Int!){
      getByEventId(eventId:$eventId){
        id
        title
        project {
          id
          prefix
        }
        location
        start
        end
        allDay
        reminderOffset
        reminderTime
        customColor
        description
        eventType {
          id
          name
          defaultStyle
          defaultColor
        }
        issue {
          id
          summary
          issueKey
          description
          issueType {
            id
            name
          }
          status {
            id
            displayName
            icone {
              id
              value
            }
          }
          parent {
            id
            issueKey
            summary
            description
            issueType {
              id
              name
            }
          }
        }
        user {
          id
          username
          firstName
          lastName
          photo
        }
      }
    }
`
const GET_PROJECT_BY_USER = gql`
    query getProjectByUser($userId:String){
      getProjectByUser(userId: $userId){
        id
        name
        prefix
        description
        issueTypes {
          id
          name
          icone {
            id
            value
            typeIcone
          }
          parent {
            id
            name
            icone {
              id
              typeIcone
              value
            }
          }
        }
        workFlows {
          id
          name
          issueTypes {
            id
            name
            icone {
              id
              value
              typeIcone
            }
          }
        }
        domainActivity {
          id
          name
          description
          image
        }
      }
    }
`
const LOAD_PERMISSION_TASK=gql`
  query loadPermissiontTask  {
    loadPermissiontTask {
        name
        roles {
          name
          description
          accessibilities
        }
    }
  }
`
export let ADD_ADD_DOCUMENT = gql`
  mutation addDocument($document:DocumentInput){
    addDocument(document:$document){
      id
      titre
      description
      uploadeds {
        name
        encodedPath
        path
      }
      issues {
        id
      }
    }
  }
`;
const GET_DOCUMENTS = gql`
    query getDocuments($issueId:Int,$typeDocument:String) {
       getDocuments(issueId:$issueId,typeDocument:$typeDocument) {
         titre
         description
         creation
         issues {
           id
         }
         userApp {
           id
           username
           lastName
           firstName
           photo
         }
         uploadeds {
           id
           path
           name
           encodedPath
         }
      }
    }
`
const SAVE_UPLOADED = gql`
   mutation saveUploaded($uploaded:UploadedInput){
     saveUploaded(uploaded:$uploaded){
        id
       name
       encodedPath
       document {
         id
       }
     }
   }
`
const LIST_ACTIVITY = gql`
  query listActivity{
    listActivity {
      id
      name
      description
      image
    }
  }
`;

export {
  supprimerTypename,
  SAVE_USER,
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
  LOAD_GROUPE_MEMBER,
  ALL_CONFIG,
  GET_CONFIG,
  SAVE_CONFIG,
  INIT_USER,
  SAVE_PROJECT,
  SAVE_ISSUE_TYPE,
  AFFECT_WORKFLOW,
  ADD_STATUS,
  ALL_PROJECT,
  GET_PROJECT,
  GET_ISSUE_TYPE,
  SAVE_WORK_FLOW,
  GET_WORK_FLOW,
  WORK_FLOWS_BY_PROJECT,
  ISSUE_BY_CRITERIA,
  SEVE_CUSTOM_FIELD,
  ALL_CUSTOM_FIELD,
  USE_CUSTOM_FIELD,
  UN_USE_CUSTOM_FIELD,
  CUSTOM_FIELD_BY_ISSUE_TYPE,
  ASSIGNE_TO_USER,
  GET_CUSTOM_FIELD,
  GET_CONFIG_PROJECT,
  SAVE_CONFIG_PROJECT,
  GET_GROUPE_USER_FOR_PROJECT,
  ADD_USER_IN_GROUPE,
  AFFECT_ISSUE_TYPE_FOR_PARENT,
  GET_ISSUE_TYPE_BY_ID,
  ALL_ISSUE_TYPE,
  REMOVE_ISSUE_TYPE_PARENT,
  LIST_ISSUE_TYPE_MASTER,
  LIST_ISSUE_TYPE_SUBTASKS,
  GET_NEXT_KEY,
  GET_ISSUE,
  LOAD_SUBTASK,
  LOAD_ISSUE_MASTER_BY_PROJECT,
  SEARCH_ISSUES,
  SAVE_EVENT,
  ALL_EVENT_TYPE,
  SEARCH_EVENTS,
  DELETE_EVENT_TYPE,
  EVENT_BY_ID,
  GET_PROJECT_BY_USER,
  LOAD_PERMISSION_TASK,
  GET_DOCUMENTS,
  SAVE_UPLOADED,
  LIST_ACTIVITY
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
