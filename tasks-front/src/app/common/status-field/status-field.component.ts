import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {Issue, IssueType, Status} from "../../type/issue";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../services/issue.service";
import {UserService} from "../../services/user.service";
import {ActivatedRoute} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {AuthGuard} from "../../services/authorization.service.ts";
import {AuthService} from "../../services/auth.service";
import {Observable} from "rxjs";
import _default from "chart.js/dist/plugins/plugin.tooltip";
import reset = _default.reset;

@Component({
  selector: 'app-status-field',
  templateUrl: './status-field.component.html',
  styleUrl: './status-field.component.css'
})
export class StatusFieldComponent implements OnInit , AfterViewInit{
  @Input() issue: Issue;
  statusDispo: Status[] = [];
  protected issueType: IssueType;
  constructor(
    private modalService: NgbModal,
    protected issueService: IssueService,
    public userService: UserService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    protected authGuard:AuthGuard,
    protected authService:AuthService

  ) {

  }

  changeStatus(status: Status) {

  }

  isActive(status: Status) {
    if (status == null || this.issue == null || this.issue.status == null) {
      return false;
    }
    return status.id == this.issue.status.id;
  }

  ngAfterViewInit(): void {

  }

  ngOnInit(): void {
    this.issueService.getIssueTypeById(this.issue.issueType.id).subscribe(issueType=>{
      this.issueType = issueType;
    })
  }

  canChangeStatus() {
    return new Observable<boolean>(observer=>{
      this.authService.getProfile().subscribe((profile:any)=>{
        if (profile.id == this.issue.assigne.id || this.issue.reporter.id == profile.id) {
          observer.next(true);
          observer.complete();
        }  else {
          observer.next(true);
          observer.complete();
        }
      })
    })
  }
}
