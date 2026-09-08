import {Component, OnInit} from '@angular/core';
import {Issue, Project} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {ProjectGuard} from "../../services/ProjectGuard";
import {MessagesService} from "../../services/messages.service";
import {Observable, shareReplay} from "rxjs";

@Component({
  standalone: false,
  selector: 'issue-master-breadcrumb',
  templateUrl: './issue-master-breadcrumb.component.html',
  styleUrl: './issue-master-breadcrumb.component.css'
})
export class IssueMasterBreadcrumbComponent implements OnInit{
   protected issue:Issue;
  issueMasters: Issue[]=[];

  /**
   * Meme regle que la barre de la liste des projets : seuls le gestionnaire de
   * projet et l'administrateur creent une issue maitre. `shareReplay` evite que
   * le `| async` relance la resolution des droits a chaque detection.
   */
  protected readonly peutCreerProjet$: Observable<boolean>;

   constructor(protected issueService:IssueService,
      protected projectGuard:ProjectGuard,
      private messageService:MessagesService
   ) {
     this.peutCreerProjet$ = this.projectGuard
       .hasCredential(['PROJECT_MANAGER', 'ADMIN'])
       .pipe(shareReplay(1));
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

  createIssueMaster() {
    this.messageService.showRight('new-issue');
  }
}
