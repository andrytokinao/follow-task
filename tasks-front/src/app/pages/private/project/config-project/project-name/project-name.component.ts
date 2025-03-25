import { Component } from '@angular/core';
import {IssueService} from "../../../../../services/issue.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-project-name',
  standalone: false,
  templateUrl: './project-name.component.html',
  styleUrl: './project-name.component.css'
})
export class ProjectNameComponent {
  user: any;
  project: any = {
    id: null,
    name: "",
    prefix:  "",
  };
  constructor(  public activeModal: NgbActiveModal,
                public issueService:IssueService,) {
  }

  save() {
    let project:any = {};
    project.id = this.project.id;
    project.name = this.project.name;
    project.prefix = this.project.prefix;
    this.issueService.createProjectOrSave(project).subscribe(
      (res:any)=>{
        this.activeModal.close({ issue: res.data.saveProject });
      },
      (error)=>{
        console.error(error);
      }
    );
  }
}
