import {Component, OnInit} from '@angular/core';
import {NewIssueComponent} from "../modal/new-issue/new-issue.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../services/issue.service";
import {Issue, Status, User} from "../../../type/issue";
import {groupBy, mergeMap, of, toArray, zip} from "rxjs";
import {MatMenuTrigger} from "@angular/material/menu";
import {UserService} from "../../../services/user.service";
import {stripTypename} from "@apollo/client/utilities";

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent implements OnInit{
  public essueService:IssueService
  public issuesBoard: [any , Issue[]][]= [];
  public issues :Issue[]= [];
  public users :User[]=[];
  public currentIssue : Issue| null = null;
  workflow: Status[]=[];
  constructor(
    private modalService: NgbModal,
    private issueService :IssueService,
    essueService:IssueService,
    public userService:UserService
  ) {
    this.essueService = essueService;
    this.essueService.getWorkFlow("projet").subscribe( (res:any) => {
        this.workflow = stripTypename(res.data.findAllStatus);
        console.log(this.workflow);
    })
    this.essueService.getIssues("prj-1").subscribe( (res:any) => {
      this.issues = stripTypename(res.data.allIssue);
      }
    )
    this.userService.getUsers().subscribe(us=>{
       this.users = us;
    })
  }


  newIssueTest(status:Status) {
    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.componentInstance.status = status;
    dialogRef.result.then((result) => {
      this.issues.push(result.issue);
      this.essueService.ajouterAuGroupe(this.issuesBoard,result.issue.status,result.issue);
    }).
    catch((reason) => {
      console.log('modal cancelled'+reason.message);
    });
  }
  newIssue(status:Status){
    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.result.then((result)=>{
      this.issues.push(result.issue);
    })
  }
  canCreate(status : Status): boolean {
    // TODO : return false if user can not create
    if(status.id ===1)
      return true;
    return false;
  }
  ngOnInit(): void {
  }
  isActive(user:User) : boolean{
    if(this.currentIssue != null )  {
      return this.currentIssue.assigne.id == user.id;
    }
    return false;
  }

  onDragStart($event: DragEvent, issue: Issue) {
    this.currentIssue = issue;
  }

  onDrop($event: DragEvent, status:any) {
    if(this.currentIssue!= null ) {
      this.currentIssue.status = status;
    }
  }

  onDragOver($event: DragEvent) {
    $event.preventDefault();
  }
  filterByStatus(status:any): Issue[] {
     return this.issues.filter(is=> is.status!=null && is.status.id == status.id);
   }
   filerWorkFlow():Status[]{
    // TODO : Filtrer l'affichage de workflow selon le role de l'utilisateur
     let flows : number[] = [0,1,2,3,4,5];
     if(this.workflow != null)
       return this.workflow.filter(wf => flows.indexOf(wf.id)!= -1);
     return [];
   }

  assigne(issue: Issue) {
    this.currentIssue = issue;
  }

  assigneToUser(user: User) {
    if(this.currentIssue != null) {
      this.currentIssue.assigne= user;
    }

  }
}
