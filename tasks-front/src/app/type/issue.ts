import {EventEmitter, Input, NgIterable} from "@angular/core";
import {IssueCanalLink, IssueMessageLink} from "../models/messaging.model";

export class Status {
  id: number =0;
  color?:String
  style?:String
  displayName: String  ="";
  icone :Icone | undefined;
}

export class IssueLabels {
  id:number
  issue:Issue
  label:Label
}

export class Issue {
  id?: number = 0;
  summary?: String= "";
  type?: number= 0;
  description?: String ="";
  deleted?:Boolean;
  issueKey?:String ="";
  creationDate?:string;
  encodedPath?:string;
  status?: Status | null = null;
  assigne?:User = new User();
  values?:CustomFieldValue[];
  reporter?:User = new User();
  issueType?:IssueType | any = {};
  parent?:Issue;
  labels?:IssueLabels[];
  comments? :Comment[] = [];
  project?:Project;
  completionPercent?:number;
  observerIds?:String[];
    attachments?: NgIterable<unknown> & NgIterable<any>;
  planning?: NgIterable<any> & NgIterable<any>;
  children?: Issue[];
  constructor() {

  }
  canalLinks?: IssueCanalLink[];
  messageLinks?: IssueMessageLink[];
  elapsedDurationMinutes?:number;
  currentCompletionPercent?:number;
}
export class User {
  id:string ="";
  username?:string="";
  firstName?:string="";
  lastName?:string="";
  photo?:string | "" ;
  email?:string ="/assets/user.png";
  cin? :string ="";
  address? :string ="";
  contact?:string='';
  groupes?:MemberGroupe[] =[];
  code?:number;

}
export class GroupeUser {
  id:number| null = null;
  name:string = '';
  prefix?:string;

  members:MemberGroupe[] = [];
}
export class MemberGroupe{
  id:number | null = null;
  groupe :GroupeUser| any = {};
  user :User | null = null;
  roles : string[] = [];
}
export class RoleApp {
  name?:string
  description?:String
  accessibilities?:String[]
}
export class Permission {
  name?:String
  roles?:RoleApp[]
}
export class Credential{
  id:number | null =null;
  name:String ="";
}
export class Comment {
  id:number|null=null;
  user : User = new User();
  text : String ="";
  date : Date ;
  issue : Issue = new Issue();
}

export interface CustomField {
  id:number;
  name?:String;
  type?:'String' | 'Date' | 'Number' | 'User' | 'Selection' | 'Checkbox';
  options?:String[];
  configDisplay?:String[];
  issueTypes?:UsingCustomField[],
  project?:Project
}


export interface CustomFieldValue {
  id?: number;
  date?:string;
  string?:String;
  text?:String;
  numeric?:number;
  user?:User
  values?:String[];
  issue:Issue
  customField:CustomField
}
export interface Repertoire {
  path?:String;
  fileName?:String;
  absolutePath?:string
  type?:String;
  repertoires?:Repertoire[]
  selected?:boolean;
  open? : boolean;
  paths?:string[]
}
export interface Uploading {
  file?:File
  status?: '' | 'pending' | 'uploading' | 'success' | 'error';
  progression?:number ;
}
export interface UploadingState {
  status:'pending' | 'uploading' | 'finished';
  index:number;
  totale:number;
}
export interface ConfigEntry{
  id:Number  ;
  version:String ;
  acive : Boolean;
  creation : String,
  workDirectory:String ;
  mediaDirectory :String ;
  dataDirectory :String ;
  configDirectory :String;
  repertoireCodeValidation:String
  projectPrefix:String
}
export interface Project {
  imageUrl?: string;
  id?:Number;
  name?:String;
  prefix?:String;
  domainActivity?:DomainActivity;
  description?:String;
  issueTypes? : IssueType[];
  workFlows? : WorkFlow[];
}
export interface IssueType{
  id?:number
  name?:String
  prefix?:String
  level?:String
  project?:Project
  color?:String
  style?:String
 curentWorkFlow?:WorkFlow;
  usingCustomFields ?: UsingCustomField[]
  icone? :Icone | undefined;
  parent?:IssueType;
  children?:IssueType[]

}
export interface WorkFlow {
  id:Number,
  name?:String,
  active? :Boolean,
  states? :Status[],
  statuses? :Status[],
  issueTypes? :IssueType[],
  project?:Project
  crossingStates? :CrossingState[],
}
interface CrossingState {
  id:Number
  name:String
  description:String
  from:Status
  to:Status
  credential:Credential
}
export interface Menu {
  label :string
  path : string
  route : string
  credancials: string[];
}
export interface Accessibility {
  routes : Set<string>
  moduleMenues : Map<string,ModuleMenu>
}
export interface ModuleMenu {
  route:string
  menues:Menu[];

}
export interface Icone {
  id:Number
  typeIcone:String
  value:String
}
export interface Criteria {
  field:String
  value:String
  operator:Status
  sousCriteria:Criteria[]
}
export interface  UsingCustomField {
  id:number
  customField:CustomField
  issueType:IssueType
}
export interface DisplayCustomField {
  setCustomFieldValue(value: any): void;
  saveValue():void;
  edit: EventEmitter<any>;
  save: EventEmitter<any>;
  isEditable? : boolean ;
  isEditing?: boolean;
  customFieldValue:CustomFieldValue

}
export interface ConfigProject{
  id:number
  configof:String
  value:string
}
export interface SeatsAvailability {
  remainingSeats: number;
}
export interface Breadcrumb {
  name: string;
  path:string;
  order:number;
  others:Breadcrumb[];
}
export interface EventTypeApp {
  id: number;
  name?: string;
  description?: string;
  defaultColor?: string;
  defaultStyle?: string;
  events?: EventApp[];
}
export interface EventApp {
  id: string | number | null;
  title?: string;
  description?: string;
  eventType?: EventTypeApp;
  start?: string;
  end?: string;
  location?: string;
  allDay?: boolean;
  reminderTime?: string;
  customColor?: string;
  customStyle?: string;
  reminderOffset?: number;
  user?: User;
  issue?: Issue;
  dateValue?:CustomFieldValue;
  project?:Project;
  completionPercentage?:number
}
export interface EventSearchCriteria {
  userIds?:String[]
  projectId?:Number;
  issueIds?: number[]
  customFieldIds?:number[]
  parrentIds?:number[]
  start?: string
  end?: string
}
export interface Uploaded{
  id:number;
  encodedPath:String;
  name:String;
  document:DocumentApp;
  path:String;
}

export class DocumentMember {
  id:Number;
  user:User;
  document:DocumentApp;
}
export class DocumentPage {
  content:DocumentApp[];
  totalElements:number;
  totalPages:number;
  currentPage:number;
  pageSize:number;
}
export class DocumentSearch {
  typeDocuments: (
    | 'ISSUE_FILES'
    | 'COMMENT_FILES'
    | 'MEDIA_FILES'
    | 'SOURCE_FILE'
    | 'DONNE_FILE'
    | 'MESSEGE_FILES'
    | 'WIKI_FILES'
    | 'EXCHANGE_DOCUMENT'
    )[];
  projectId?:number;
  issueIds?:number[];
  memberUserIds?:string[];
  createdFrom?:string;
  createdTo?:string;
  keyword?:string;

  deleted?:boolean;
}
export interface DocumentApp{
  id?:number;
  titre?:String;
  description?:string;
  typeDocument?: string | 'ISSUE_FILES' | 'COMMENT_FILES' |  'MEDIA_FILES' | 'SOURCE_FILE' | 'DONNE_FILE' | 'MESSEGE_FILES' |'WIKI_FILES' | 'ISSUE_FILES' | 'EXCHANGE_DOCUMENT' ;
  creation?:string;
  userApp?:User;
  issues?:Issue;
  documentMembers?:DocumentMember[];
  members?:String[];
  uploadeds?:Uploaded[];
  project?:Project
  parent?:DocumentApp
  responses?:DocumentApp[]
  deleted?:Boolean
  readStatuses?:DocumentReadStatus[]
  issueUsages?:IssueDocumentUsage[]

}
export interface DocumentReadStatus {
  id:number
  user:User
  document:Document
  readAt:String
}
export type DocumentUsageType =
  | 'COMMENT'
  | 'MEDIA'
  | 'SOURCE'
  | 'DATA'
  | 'MESSAGE'
  | 'WIKI'
  | 'ISSUE'
  | 'EXCHANGE'
  | 'RESPONSE';
export interface IssueDocumentUsage {
  id: string;
  usageType: DocumentUsageType;
  usages:DocumentUsageType[];
  issue: Issue;
  document: DocumentApp;
}
export  interface DocumentUsageTypeMeta {
  value:String,
  label:String,
  description:String
}
export interface DomainActivity{
  id?:number;
  name?:string;
  description?:string;
  image?:String;
}
export interface Label{
  id?:number
  name?:string
  style?:string
  color?:string
  icone?:Icone
  project?:Project

}
export interface AppSettings {
  id?:number
  cle:String
  created?:string;
  updated?:string;
  active?:Boolean;
  settingType?:String;
  settingsValue?:String
  user?:User;
  project?:Project
}

export interface CanalMember {
  id:Number
  user:User
  canall:Canall
  credentials?:String[]
}

export interface Canall {
  id?:Number
  messageApp?:MessageApp[]
  members?:CanalMember[]
  typeCanal:'PROJECT' | 'ISSUE' | 'DEFAULT',
  pseudo?:String,
  projects?:Project
  issueMaster?:Issue,
  membersIds?:String[]
}
export class MessageApp {
  id?: number;
  externalMessageId?: string;
  canalExternalId?:string;
  canall?: Canall;
  created?: string;
  text: string;
  mediaType?: string;
  sender?: User;
  fallbackSenderName?: string;
  processed?: boolean;
  messageLinks?: IssueMessageLink[];
  userReades?: string[];
}

export abstract class ActionItem {
  id?:Number
  actionType : 'CHANGE_FIELD' | 'CUSTOM_FIELD' | 'STATUS' | 'ASSIGN'|'ADD_EVENT'| 'CHANGE_PROFILE' | 'UPLOAD' | 'COMMENT' | 'DOCUMENT'
  actionGroupe:ActionGroupe
   details:any;
  constructor(groupe: ActionGroupe) {
    this.actionGroupe = groupe;
  }
}
export class ActionProfile extends ActionItem {
  profile:User
  constructor(groupe:ActionGroupe,profile:User) {
    super(groupe);
    this.actionType = "CHANGE_PROFILE";
    this.profile = profile;
  }
}
export class ActionAssigne extends ActionItem {
  assigne:User
  constructor(groupe:ActionGroupe,assigne:User) {
    super(groupe);
    this.actionType="ASSIGN";
    this.assigne = assigne;
  }
}
export class ActionField extends ActionItem {
  fieldName:String
  fieldValue:String
  oldValue:String
  value:CustomFieldValue
  constructor(groupe:ActionGroupe,value:CustomFieldValue) {
    super(groupe);
    this.actionType="CUSTOM_FIELD";
    this.value = value;
  }
}
export class ActionStatus extends ActionItem {
  oldStatus:String
  newStatus:String
  status:Status
  constructor(groupe:ActionGroupe,status:Status) {
    super(groupe);
    this.actionType="STATUS";
    this.status = status;
  }
}
export interface ActionGroupe {
  id?:Number
  actions?:ActionItem[]
  user?:User
  issue?:Issue
  created?:Date
}
export interface NotificationApp{
  id:Number
  project:Project
  titre:String
  message:String
  userIds:String[]
  seenUserIds:String[]
  readUserIds:String[]
  action:ActionGroupe
  issueLinks:String[]
}
export interface ResponseApp {
  code:String
  message:String
  status:String
}
export interface UserPlanningStat {
  user: User;
  totalMinutes: number;
  spentMinutes: number;
  remainingMinutes: number;
}

export interface IssuePlanningSummary {
  issue: Issue;
  totalMinutes?: number;
  spentMinutes?: number;
  remainingMinutes?: number;
  userStats: UserPlanningStat[];
}
export interface PercentageProposal {
  proposed:number
  lastKnown:number
  averageStep:number
  reason:String
  candidates:number[]
}


// ── Utilitaire : détecter le type de fichier à partir du nom ──────────────────

export type FileCategory =
  | 'folder'
  | 'doc'
  | 'xls'
  | 'pdf'
  | 'img'
  | 'code'
  | 'video'
  | 'audio'
  | 'archive'
  | 'txt'
  | 'unknown';

export interface FileTypeInfo {
  category: FileCategory;
  badge: string;        // ex: 'PDF'
  icon: string;         // classe Tabler icon
  iconColor: string;    // couleur CSS
  badgeClass: string;   // classe CSS du badge
}

const EXT_MAP: Record<string, FileTypeInfo> = {
  // Documents texte
  docx: { category: 'doc',     badge: 'DOC',  icon: 'ti-file-text',        iconColor: '#3B82F6', badgeClass: 'ft-doc'     },
  doc:  { category: 'doc',     badge: 'DOC',  icon: 'ti-file-text',        iconColor: '#3B82F6', badgeClass: 'ft-doc'     },
  odt:  { category: 'doc',     badge: 'ODT',  icon: 'ti-file-text',        iconColor: '#3B82F6', badgeClass: 'ft-doc'     },
  pptx: { category: 'doc',     badge: 'PPT',  icon: 'ti-presentation',     iconColor: '#EF4444', badgeClass: 'ft-ppt'     },
  ppt:  { category: 'doc',     badge: 'PPT',  icon: 'ti-presentation',     iconColor: '#EF4444', badgeClass: 'ft-ppt'     },
  // Tableurs
  xlsx: { category: 'xls',     badge: 'XLS',  icon: 'ti-table',            iconColor: '#22C55E', badgeClass: 'ft-xls'     },
  xls:  { category: 'xls',     badge: 'XLS',  icon: 'ti-table',            iconColor: '#22C55E', badgeClass: 'ft-xls'     },
  csv:  { category: 'xls',     badge: 'CSV',  icon: 'ti-table',            iconColor: '#22C55E', badgeClass: 'ft-xls'     },
  ods:  { category: 'xls',     badge: 'ODS',  icon: 'ti-table',            iconColor: '#22C55E', badgeClass: 'ft-xls'     },
  // PDF
  pdf:  { category: 'pdf',     badge: 'PDF',  icon: 'ti-file-description', iconColor: '#A855F7', badgeClass: 'ft-pdf'     },
  // Images
  jpg:  { category: 'img',     badge: 'IMG',  icon: 'ti-photo',            iconColor: '#F59E0B', badgeClass: 'ft-img'     },
  jpeg: { category: 'img',     badge: 'IMG',  icon: 'ti-photo',            iconColor: '#F59E0B', badgeClass: 'ft-img'     },
  png:  { category: 'img',     badge: 'PNG',  icon: 'ti-photo',            iconColor: '#F59E0B', badgeClass: 'ft-img'     },
  gif:  { category: 'img',     badge: 'GIF',  icon: 'ti-photo',            iconColor: '#F59E0B', badgeClass: 'ft-img'     },
  svg:  { category: 'img',     badge: 'SVG',  icon: 'ti-vector',           iconColor: '#F59E0B', badgeClass: 'ft-img'     },
  webp: { category: 'img',     badge: 'IMG',  icon: 'ti-photo',            iconColor: '#F59E0B', badgeClass: 'ft-img'     },
  // Code
  ts:   { category: 'code',    badge: 'TS',   icon: 'ti-brand-typescript', iconColor: '#6366F1', badgeClass: 'ft-code'    },
  js:   { category: 'code',    badge: 'JS',   icon: 'ti-brand-javascript', iconColor: '#6366F1', badgeClass: 'ft-code'    },
  py:   { category: 'code',    badge: 'PY',   icon: 'ti-code',             iconColor: '#6366F1', badgeClass: 'ft-code'    },
  java: { category: 'code',    badge: 'JAVA', icon: 'ti-coffee',           iconColor: '#6366F1', badgeClass: 'ft-code'    },
  html: { category: 'code',    badge: 'HTML', icon: 'ti-code',             iconColor: '#6366F1', badgeClass: 'ft-code'    },
  css:  { category: 'code',    badge: 'CSS',  icon: 'ti-code',             iconColor: '#6366F1', badgeClass: 'ft-code'    },
  json: { category: 'code',    badge: 'JSON', icon: 'ti-braces',           iconColor: '#6366F1', badgeClass: 'ft-code'    },
  xml:  { category: 'code',    badge: 'XML',  icon: 'ti-code',             iconColor: '#6366F1', badgeClass: 'ft-code'    },
  sql:  { category: 'code',    badge: 'SQL',  icon: 'ti-database',         iconColor: '#6366F1', badgeClass: 'ft-code'    },
  r:    { category: 'code',    badge: 'R',    icon: 'ti-code',             iconColor: '#6366F1', badgeClass: 'ft-code'    },
  // Vidéo
  mp4:  { category: 'video',   badge: 'MP4',  icon: 'ti-video',            iconColor: '#EC4899', badgeClass: 'ft-video'   },
  avi:  { category: 'video',   badge: 'AVI',  icon: 'ti-video',            iconColor: '#EC4899', badgeClass: 'ft-video'   },
  mkv:  { category: 'video',   badge: 'MKV',  icon: 'ti-video',            iconColor: '#EC4899', badgeClass: 'ft-video'   },
  // Audio
  mp3:  { category: 'audio',   badge: 'MP3',  icon: 'ti-music',            iconColor: '#14B8A6', badgeClass: 'ft-audio'   },
  wav:  { category: 'audio',   badge: 'WAV',  icon: 'ti-music',            iconColor: '#14B8A6', badgeClass: 'ft-audio'   },
  // Archives
  zip:  { category: 'archive', badge: 'ZIP',  icon: 'ti-file-zip',         iconColor: '#78716C', badgeClass: 'ft-archive' },
  rar:  { category: 'archive', badge: 'RAR',  icon: 'ti-file-zip',         iconColor: '#78716C', badgeClass: 'ft-archive' },
  tar:  { category: 'archive', badge: 'TAR',  icon: 'ti-file-zip',         iconColor: '#78716C', badgeClass: 'ft-archive' },
  gz:   { category: 'archive', badge: 'GZ',   icon: 'ti-file-zip',         iconColor: '#78716C', badgeClass: 'ft-archive' },
  // Texte
  txt:  { category: 'txt',     badge: 'TXT',  icon: 'ti-file',             iconColor: '#6B7280', badgeClass: 'ft-txt'     },
  md:   { category: 'txt',     badge: 'MD',   icon: 'ti-markdown',         iconColor: '#6B7280', badgeClass: 'ft-txt'     },
};

const FOLDER_INFO: FileTypeInfo = {
  category: 'folder',
  badge: '',
  icon: 'ti-folder',
  iconColor: '#F59E0B',
  badgeClass: '',
};

const UNKNOWN_INFO: FileTypeInfo = {
  category: 'unknown',
  badge: 'FILE',
  icon: 'ti-file',
  iconColor: '#9CA3AF',
  badgeClass: 'ft-txt',
};

export function getFileTypeInfo(repertoire: Repertoire): FileTypeInfo {
  if (repertoire.type === 'folder') return FOLDER_INFO;
  const ext = repertoire.fileName.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MAP[ext] ?? UNKNOWN_INFO;
}
