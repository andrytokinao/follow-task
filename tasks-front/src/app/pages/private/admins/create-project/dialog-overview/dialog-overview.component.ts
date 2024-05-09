import { Component } from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {NewIssueComponent} from "../../../project/modal/new-issue/new-issue.component";
import {ProjectNameComponent} from "../project-name/project-name.component";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {IssueType, Project} from "../../../../../type/issue";
import {stripTypename} from "@apollo/client/utilities";
import {IssueTypeComponent} from "../issue-type/issue-type.component";

@Component({
  selector: 'app-dialog-overview',
  templateUrl: './dialog-overview.component.html',
  styleUrl: './dialog-overview.component.css'
})
export class DialogOverviewComponent {
   project:Project | any = {};
   constructor(private router: Router,
               private modalService: NgbModal,
               private configService:ConfigService,
               private issueService:IssueService,
               private route: ActivatedRoute
   ) {

      if(router.url.includes('create-project/create')) {
        const dialogRef = this.modalService.open(ProjectNameComponent);
        dialogRef.result.then((result)=>{
          this.project.name = stripTypename(result.name);
          this.project.prefix = stripTypename(result.prefix);
          this.project.id = stripTypename(result.id);
        })
      }else if(router.url.includes('create-project/issue-type')) {
        this.route.queryParams
          .subscribe((params:any) => {
            if(this.project.prefix != params.project) {
              this.issueService.getProject(params.project).subscribe(
                (res: Project) => {
                  this.project = res;
                  const dialogRef = this.modalService.open(IssueTypeComponent,{windowClass: "xlModal"});
                  dialogRef.componentInstance.project = this.project;
                },
                (err: any) => {
                  console.error(err);
                }
              );
            }
            }
          );
     } else if(router.url.includes('/work-flow')) {
        this.route.queryParams
          .subscribe((params:any) => {
              if( params.issueType) {
                this.issueService.getIssueType(params.issueType).subscribe(
                  (issueType:IssueType)=>{
                    const dialogRef = this.modalService.open(IssueTypeComponent,{windowClass: "xlModal"});
                    alert(JSON.stringify(issueType));
                    dialogRef.componentInstance.issueType = issueType;
                  }
                )

              } else {
                alert("Issue type obligatoire");
              }
            }
          );
     }else if(router.url.includes('/work-flow-status')) {
       alert("OPEN CREATE STATUS");
     }

   }
}
