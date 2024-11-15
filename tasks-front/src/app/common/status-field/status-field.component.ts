import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {Issue, IssueType, Status} from "../../type/issue";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../services/issue.service";
import {UserService} from "../../services/user.service";
import {ActivatedRoute} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {AuthGuard} from "../../services/authorization.service.ts";

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
    protected authGuard:AuthGuard

  ) {

  }

  changeStatus(status: Status) {

  }

  isActive(status: Status) {
    if (status == null || this.issue == null || this.issue.status) {
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
}
