import {EventEmitter, Input} from "@angular/core";

export class Status {
  id: number =0;
  displayName: String  ="";
  icone :Icone | undefined;
}
export class Issue {
  id: number = 0;
  summary: String= "";
  type: number= 0;
  description: String ="";
  issueKey:String ="";
  status: Status | null = null;
  assigne:User = new User();
  reporter:User = new User();
  issueType:IssueType | any = {};
  comments :Comment[] = [];
  constructor() {

  }
}
export class User {
  id:String ="";
  username:string="";
  firstName:string="";
  lastName:string="";
  photo:string ="";
  email:string ="";
  cin :string ="";
  address :string ="";
  contact:string='';
  groupes:MemberGroupe[] =[];

}
export class GroupeUser {
  id:number| null = null;
  name:string = '';
  members:MemberGroupe[] = [];
}
export class MemberGroupe{
  id:number | null = null;
  groupe :GroupeUser| any = {};
  user :User | null = null;
  role : string = '';
}
export class Role {
  id:number | null = null;
  memberGroupes:MemberGroupe[] =[];
  credentials:Credential[] =[];
}
export class Credential{
  id:number | null =null;
  name:String ="";
}
export class Comment {
  id:number|null=null;
  user : User = new User();
  text : String ="";
  date : String ="";
  issue : Issue = new Issue();
}

export interface CustomField {
  id:number;
  name:String;
  type:string;
}

export interface CustomFieldValue {
  id: number;
  date:string;
  string:String;
  text:String;
  numeric:number;
  user:User
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
}
export interface Uploading {
  file:File
  status:string ;
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
  id:Number;
  name:String;
  prefix:String;
  issueTypes : IssueType[];
  workFlows : WorkFlow[];
}
export interface IssueType{
  id:number
  name:String
  prefix:String
  project:Project
 curentWorkFlow:WorkFlow;
  usingCustomFields : UsingCustomField[]

}
export interface WorkFlow {
  id:Number,
  name:String,
  active :Boolean,
  states :Status[],
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
