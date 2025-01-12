import {Component, OnInit} from '@angular/core';
import {DocumentApp, Issue, Project, Uploaded, Uploading} from "../../../../../type/issue";
import {IssueService} from "../../../../../services/issue.service";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";

@Component({
  selector: 'app-dossier-source',
  templateUrl: './dossier-source.component.html',
  styleUrl: './dossier-source.component.css'
})
export class DossierSourceComponent implements OnInit{
  protected uploadings: Uploading[] = [];
  protected filesToUploads: FileList;
  protected isNewFile = false;
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
      this.parentIssue = data['parrentIssue'];
    });
  }
}
