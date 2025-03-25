import {Component, OnInit} from '@angular/core';
import {EventSearchCriteria, Issue} from "../../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {EventsService} from "../../../../../services/events.service";

@Component({
  standalone:false,
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.css'
})
export class PlanningComponent implements OnInit{
  eventCriteria: EventSearchCriteria ;
  private parentIssue: Issue;
  issues : Issue[];
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService: ConfigService,
              private issueService: IssueService,
              private userService: UserService,
              private route: ActivatedRoute,
              private authService: AuthService,
              private eventSevice:EventsService
  ) {
  }
  ngOnInit(): void {
    this.route.data.subscribe(data => {
    });
    this.issueService.issueMaster$.subscribe(issue => {
      this.parentIssue = issue;
      this.loadSubtask();

    })

  }
  protected loadSubtask() {
    this.issueService.loadSubtaskAndSet(this.parentIssue.id);
  }
}
