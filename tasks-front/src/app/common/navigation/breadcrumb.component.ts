import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {BreadcrumbService} from "../../services/breadcrumb.service";
import {NewIssueComponent} from "../../pages/private/project/modal/new-issue/new-issue.component";
import {Issue} from "../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {IssueService} from "../../services/issue.service";
import {AuthGuard} from "../../services/authorization.service.ts";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs = [];
  activeSubMenu: number | null = null;
  @Output() createMaster = new EventEmitter<any>();

  constructor(private breadcrumbService: BreadcrumbService) {}

  ngOnInit(): void {
    this.breadcrumbService.breadcrumbs.subscribe(breadcrumbs => {
      this.breadcrumbs = breadcrumbs;
    });
  }

  toggleSubMenu(index: number) {
    this.activeSubMenu = this.activeSubMenu === index ? null : index;
  }
  newMaster(){
    this.createMaster.emit({});
  }
}
