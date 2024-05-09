import { Component } from '@angular/core';
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-project-name',
  templateUrl: './project-name.component.html',
  styleUrl: './project-name.component.css'
})
export class ProjectNameComponent {
  user: any;
  project: any = {
    id: null,
    name: "",
    prefix:  "",
    issueTypes : []
  };
  constructor(  public activeModal: NgbActiveModal,
                public issueService:IssueService,) {
  }

  save() {
    this.issueService.saveProject(this.project).subscribe(
      (res:any)=>{
        this.activeModal.close({ issue: res.data.saveProject });

      },
      (error)=>{
        console.error(error);
      }
    );
  }
}
