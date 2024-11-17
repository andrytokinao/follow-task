import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../services/issue.service";
import {stripTypename} from "@apollo/client/utilities";
import {Issue} from "../../../type/issue";

@Component({
  selector: 'app-popup-create-project',

  templateUrl: './popup-create-project.component.html',
  styleUrl: './popup-create-project.component.css'
})
export class PopupCreateProjectComponent {
  errorMessage:String = undefined;
  user: any;
  project: any = {
    id: null,
    name: "",
    prefix:  "",
    description:""
  };
  constructor(  public activeModal: NgbActiveModal,
                public issueService:IssueService,) {
  }

  save() {
    this. errorMessage= undefined;
    let project:any = {};
    project.id = this.project.id;
    project.name = this.project.name;
    project.prefix = this.project.prefix;
    project.description = this.project.description;
    this.issueService.createProjectOrSave(project).subscribe(
      (res:any)=>{
        this.activeModal.close( stripTypename(res));

      },
      (error)=>{
        this.errorMessage = error.message;
        console.error(error);
      }
    );
  }
}
