import { Component } from '@angular/core';
import {IssueType, Project} from "../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../services/config.service";
import {IssueService} from "../../../../services/issue.service";
import {ProjectNameComponent} from "./project-name/project-name.component";
import {stripTypename} from "@apollo/client/utilities";
import {IssueTypeComponent} from "./issue-type/issue-type.component";
import {BackupComponent} from "../configuration/backup/backup.component";
import {ArchiveComponent} from "../configuration/archive/archive.component";
import {SwitchVersionComponent} from "../configuration/switch-version/switch-version.component";
import {MediaSpaceComponent} from "../configuration/media-space/media-space.component";
import {WorkSpaceComponent} from "../configuration/work-space/work-space.component";
import {InstallDataComponent} from "../configuration/install-data/install-data.component";

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.css'
})
export class CreateProjectComponent {
  project:Project | any = {};
  dialogMap: { [regex: string]: any } = {
    'private/admin/project/create$': ProjectNameComponent,
    'private/admin/project/issue-type': IssueTypeComponent,
    'switch-version$': SwitchVersionComponent,
    '\/media-space$': MediaSpaceComponent,
    '\/work-space$': WorkSpaceComponent,
    '\/install-data$': InstallDataComponent,
  };
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService:ConfigService,
              private issueService:IssueService,
              private route: ActivatedRoute
  ) {
    if(router.url.includes('/private/admin/project/create')) {
      const dialogRef = this.modalService.open(ProjectNameComponent);
      dialogRef.result.then((result)=>{
        this.project.name = stripTypename(result.name);
        this.project.prefix = stripTypename(result.prefix);
        this.project.id = stripTypename(result.id);
      })
    }else if(router.url.includes('private/admin/project/issue-type')) {
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
