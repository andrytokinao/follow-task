import {Component, OnInit} from '@angular/core';
import {Issue} from "../../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";

@Component({
  standalone:false,
  selector: 'app-discussion',
  templateUrl: './discussion.component.html',
  styleUrl: './discussion.component.css'
})
export class DiscussionComponent  implements OnInit {
  issue: Issue;
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService: ConfigService,
              protected issueService: IssueService,
              private userService: UserService,
              private route: ActivatedRoute,
              private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.issueService.issueMaster$.subscribe(issue => {
      this.issue = issue;
    })
  }

}
