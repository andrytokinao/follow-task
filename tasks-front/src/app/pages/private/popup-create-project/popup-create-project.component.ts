import {AfterViewInit, Component, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../services/issue.service";
import {stripTypename} from "@apollo/client/utilities";
import {DomainActivity, Issue, Project} from "../../../type/issue";
import {error} from "@angular/compiler-cli/src/transformers/util";

@Component({
  selector: 'app-popup-create-project',

  templateUrl: './popup-create-project.component.html',
  styleUrl: './popup-create-project.component.css'
})
export class PopupCreateProjectComponent implements OnInit{
  errorMessage:String = undefined;
  user: any;
  project: any = {
    id: null,
    name: "",
    prefix:  "",
    description:"",
    domainActivity : {},
  };
  domainActivity: DomainActivity = {};
  domains: DomainActivity[] = [];
  constructor(  public activeModal: NgbActiveModal,
                public issueService:IssueService,) {
  }

  save() {
    this. errorMessage= undefined;
    let project:Project = {};
    project.id = this.project.id;
    project.name = this.project.name;
    project.prefix = this.project.prefix;
    project.description = this.project.description;
    if (this.domainActivity?.id) {
      project.domainActivity = this.domainActivity;
    }
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

  ngOnInit(): void {
    this.issueService.getDomainActivityList().subscribe( domains => {
      this.domains = domains;
    })
  }

  selectActivity(dm: DomainActivity) {
    this.domainActivity = dm;
  }
}
