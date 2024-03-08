export class Status {
  id: number =0;
  displayName: String  ="";
  iconeFile:String = "";
}
export class Issue {
  id: number = 0;
  summary: String= "kimaso";
  type: number= 0;
  description: String ="";
  status: Status | null = null;
  assigne:User = new User();
  reporter:User = new User();
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
