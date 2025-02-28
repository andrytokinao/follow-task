import {Component, OnInit} from '@angular/core';
import {Issue, Project} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {ProjectGuard} from "../../services/ProjectGuard";

@Component({
  selector: 'issue-master-breadcrumb',
  templateUrl: './issue-master-breadcrumb.component.html',
  styleUrl: './issue-master-breadcrumb.component.css'
})
export class IssueMasterBreadcrumbComponent implements OnInit{
   protected issue:Issue;
  issueMasters: Issue[]=[];
   constructor(protected issueService:IssueService,
  protected projectGuard:ProjectGuard) {
   }
  ngOnInit(): void {
     this.issueService.issueMaster$.subscribe(issue => {
       this.issue = issue;
     });
     this.issueService.issueMasterList$.subscribe(masters => {
       this.issueMasters = masters;
     })
  }

  createMaster() {

  }
}
