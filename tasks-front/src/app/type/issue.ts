export class Status {
  id: number =0;
  displayName: String | null ="";
  description: String = "";
}
export class Issue {
  id: number = 0;
  summary: String= "";
  type: string= "";
  description: String ="";
  status: Status | null = null;
  constructor() {

  }
}
