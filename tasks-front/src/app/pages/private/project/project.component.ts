import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Route, Router} from "@angular/router";
import {IssueService} from "../../../services/issue.service";
import {Issue, Project} from "../../../type/issue";
import {AuthGuard} from "../../../services/authorization.service.ts";
import {NewIssueComponent} from "./modal/new-issue/new-issue.component";
import {stripTypename} from "@apollo/client/utilities";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ViewEditIssueComponent} from "./modal/view-edit-issue/view-edit-issue.component";

@Component({
  selector: 'app-project',
  standalone: false,
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit{
  project:Project | undefined;
  private issues: Issue[]=[]
  constructor(
    private route:ActivatedRoute,
    private issueService:IssueService,
    protected authGuard:AuthGuard,
    private modalService: NgbModal,
    private router: Router,

  ) {
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.project = data['project'];
    });
  }
  editIssue(issue:Issue){
    const dialogRef = this.modalService.open(ViewEditIssueComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.issue = issue;
    dialogRef.result.then((result) => {
    })
  }
  createMaster() {
    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.componentInstance.listIssueTypeMaster(this.project.id);
    dialogRef.componentInstance.project = this.project;
    dialogRef.result.then((result) => {
      this.issues = <Issue[]>(result.issues)
     dialogRef.result.then(res=> {
       if (res != null) {
           if( res.step == "next") {
             this.editIssue(res.issue);
           } else if (res.step == "complete") {
         //  this.router.navigate(['/issue/:res.issue.issueKey]); TODO : A etudier l'affichage de project sur cette route
             const currentPath = this.route.snapshot.url.map(segment => segment.path);
             alert(JSON.stringify(currentPath));
             const newPath = [...currentPath, 'issue/' +res.issue.issueKey];

             this.router.navigate(newPath);
           }
       }
     })
    })
  }
}
