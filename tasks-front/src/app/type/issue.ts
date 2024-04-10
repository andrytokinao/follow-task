export class Status {
  id: number =0;
  displayName: String  ="";
  iconeFile:String = "";
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
  type:String;
}

export interface CustomFieldValue {
  id: number;
  date:String;
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
}
