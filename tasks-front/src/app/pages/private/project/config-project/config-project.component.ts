import {Component, OnInit} from '@angular/core';
import {IssueType, Project} from "../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../services/config.service";
import {IssueService} from "../../../../services/issue.service";
import {ProjectNameComponent} from "./project-name/project-name.component";
import {stripTypename} from "@apollo/client/utilities";
import {IssueTypeComponent} from "./issue-type/issue-type.component";


@Component({
  selector: 'app-create-project',
  templateUrl: './config-project.component.html',
  styleUrl: './config-project.component.css'
})
export class ConfigProjectComponent implements OnInit{
  project:Project | any = {};
  dialogMap: { [regex: string]: any } = {
    'private/admin/project/create$': ProjectNameComponent,
    'private/admin/project/issue-type': IssueTypeComponent,
  };
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService:ConfigService,
              private issueService:IssueService,
              private route: ActivatedRoute
  ) {

  }
  configWorkFlow(){
    const dialogRef = this.modalService.open(IssueTypeComponent,{windowClass: "xlModal"});
    dialogRef.componentInstance.project = this.project;
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.project = data['project'];
    });
  }
}
