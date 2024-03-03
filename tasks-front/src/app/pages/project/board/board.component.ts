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
  constructor(
    private modalService: NgbModal,
    essueService:IssueService
  ) {
    this.essueService = essueService;
    this.essueService.getIsses().pipe(
        mergeMap(res=> res),
        groupBy(issue => issue.status , s => s),
        mergeMap(groupe => zip(of(groupe.key), groupe.pipe(toArray())))
      ).subscribe(r=>{
        this.issuesBoard.push( r);
        this.issuesBoard.sort((a,b)=>{
          if (a[0].index < b[0].index) {
            return -1;
          } else if (a[0].index > b[0].index) {
            return 1;
          } else {
            return 0;
          }
        })
    })
  }


  newIssue(status:Status) {
    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.componentInstance.status = status;
    dialogRef.result.then((result) => {
      this.issues.push(result.issue);
      this.ajouterAuGroupe(this.issuesBoard,result.issue.status,result.issue);
    }).
    catch((reason) => {
      console.log('modal cancelled'+reason.message);
    });
  }
  ajouterAuGroupe(liste: [any, Issue[]][], groupe: any, issue: Issue): void {
    let groupeExiste = false;
    for (let i = 0; i < liste.length; i++) {
      if (liste[i][0].id === groupe.id) {
        liste[i][1].push(issue);
        groupeExiste = true;
        break;
      }
    }
    if (!groupeExiste) {
      liste.push([groupe, [issue]]);
    }
  }
  ngOnInit(): void {
  }
}
