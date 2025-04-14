import {EventEmitter, Input} from "@angular/core";

export class Status {
  id: number =0;
  color:String
  style:String
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
  encodedPath?:String;
  status?: Status | null = null;
  assigne?:User = new User();
  values?:CustomFieldValue[];
  reporter?:User = new User();
  issueType?:IssueType | any = {};
  parent?:Issue
  labels?:IssueLabels[]
  comments? :Comment[] = [];
  project?:Project;
  constructor() {

  }
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
  name:String;
  type:'String' | 'Date' | 'Number' | 'User' | 'Selection' | 'Checkbox';
  options:String[];
  configDisplay:String[];
  issueTypes:UsingCustomField[],
  project:Project
}


export interface CustomFieldValue {
  id: number;
  date:string;
  string:String;
  text:String;
  numeric:number;
  user:User
  values:String[];
  issue:Issue
  customField:CustomField
}
export interface Repertoire {
  path:String;
  fileName:String;
  absolutePath:string
  type:String;
  repertoires:Repertoire[]
  selected:boolean;
  open : boolean;
  paths:string[]
}
export interface Uploading {
  file:File
  status: '' | 'pending' | 'uploading' | 'success' | 'error';
  progression:number ;
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
  id:number
  name:String
  prefix:String
  level:String
  project:Project
  color:String
  style:String
 curentWorkFlow:WorkFlow;
  usingCustomFields : UsingCustomField[]
  icone :Icone | undefined;
  parent:IssueType;
  children:IssueType[]

}
export interface WorkFlow {
  id:Number,
  name:String,
  active :Boolean,
  states :Status[],
  statuses :Status[],
  issueTypes :IssueType[],
  project:Project
  crossingStates :CrossingState[],
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
  name: string;
  description?: string;
  defaultColor?: string;
  defaultStyle?: string;
  events?: EventApp[];
}
export interface EventApp {
  id: string | number;
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

class DocumentMember {
  id:Number;
  user:User;
  document:DocumentApp;
}

export interface DocumentApp{
  id?:number;
  titre?:String;
  description?:string;
  typeDocument?:string;
  creation?:string;
  userApp?:User;
  issues?:Issue;
  documentMembers?:DocumentMember[];
  members?:String[];
  uploadeds?:Uploaded[];
  project?:Project
  parent?:DocumentApp
  responses?:DocumentApp[]
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
export interface MessageApp {
  id?:Number
  canall:Canall
  created?:String
  text:String
  sender:User
  userReades?:String[];
}
export interface ActionItem {
  id?:Number
  actionType : 'CHANGE_FIELD' | 'CUSTOM_FIELD' | 'STATUS' | 'ASSIGN'|'ADD_EVENT'| 'CHANGE_PROFILE' | 'UPLOAD' | 'COMMENT' | 'DOCUMENT'
  actionGroupe:ActionGroupe,
   details:any;
}
export interface ActionGroupe {
   id:Number
  actions:ActionItem[]
  user:User
  issue:Issue
  created:Date
}
