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
  status: Status | null = null;
  assigne:User = new User();
  reporter:User = new User();
  comments :Comment[] = [];
  constructor() {

  }
}
export class User {
  id:number =0;
  username:string="";
  firstName:string="";
  lastName:string="";
  photo:string ="";
}
export class Comment {
  user : User = new User();
  text : String ="";
  date : String ="";
  issue : Issue = new Issue();
}
