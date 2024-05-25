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

}
