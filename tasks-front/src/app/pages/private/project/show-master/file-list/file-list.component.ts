import { Component } from '@angular/core';
import {
  CustomFieldValue,
  DocumentApp,
  Issue,
  IssueType,
  Repertoire,
  Uploading,
  UsingCustomField
} from "../../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {concatMap, Observable} from "rxjs";

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrl: './file-list.component.css'
})
export class FileListComponent {
  protected typeDocument = 'DONNE_FILE'
  protected parentIssue: Issue;


  constructor(private router: Router,
              private modalService: NgbModal,
              private configService: ConfigService,
              protected issueService: IssueService,
              private userService: UserService,
              private route: ActivatedRoute,
              private authService: AuthService
  ) {
  }
  documents:DocumentApp[] = [ ];
  ngOnInit(): void {
    this.route.data.subscribe(data => {
   //   this.parentIssue = data['parrentIssue'];
    });
    this.issueService.issueMaster$.subscribe(issue => {
      this.parentIssue = issue;
    })
  }
}
