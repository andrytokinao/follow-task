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
  cin :string ="";
  contact:string='';
  groupes:[MemberGroupe] =[];

}
export class GroupeUser {
  id:number;
  name:string;
  members:MemberGroupe[] = [];
}
export class MemberGroupe{
  id:number;
  groupe :GroupeUser;
  user :User;
  roles :Role[]
}
export class Role {
  id:number
  memberGroupes:[MemberGroupe]
  credentials:Credential[]
}
export class Credential{
  id:number
  name:String
}
export class Comment {
  id:number;
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
