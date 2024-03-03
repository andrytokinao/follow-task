import {Component, OnInit} from '@angular/core';
import {NewIssueComponent} from "../modal/new-issue/new-issue.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../services/issue.service";
import {Issue, Status} from "../../../type/issue";
import {groupBy, mergeMap, of, toArray, zip} from "rxjs";

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent implements OnInit{
  public essueService:IssueService
  public issuesBoard: [any , Issue[]][]= [];
  public issues :Issue[]= [];
  public currentIssue : Issue| null = null;
  workflow: Status[]=[];
  constructor(
    private modalService: NgbModal,
    essueService:IssueService
  ) {
    this.essueService = essueService;
    this.essueService.getIsses().subscribe( res => {
        this.issues = res;
    })
    this.essueService.getWorkFlow("prj-1").subscribe( res => {
        this.workflow = res;
      }
    )
  }


  newIssue(status:Status) {
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
  canCreate(status : Status): boolean {
    // TODO : return false if user can not create
    if(status.id ===0)
      return true;
    return false;
  }
  ngOnInit(): void {
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

}
