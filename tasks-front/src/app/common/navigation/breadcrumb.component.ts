import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {BreadcrumbService} from "../../services/breadcrumb.service";
import {NewIssueComponent} from "../../pages/private/project/modal/new-issue/new-issue.component";
import {Breadcrumb, Issue, Project} from "../../type/issue";
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
  project:Project | undefined;

  activeSubMenu: number | null = null;
  @Output() createMaster = new EventEmitter<any>();

  constructor(private breadcrumbService: BreadcrumbService,   private route:ActivatedRoute,) {

  }

  ngOnInit(): void {
    this.breadcrumbService.breadcrumbs.subscribe(breadcrumbs => {
      this.breadcrumbs = breadcrumbs;
    });
    this.route.data.subscribe(data => {
      const breadcrumb: Breadcrumb[] = data['breadcrumb'];
      this.project = data['project'];
       console.debug(breadcrumb);
       this.breadcrumbService.setBreadcrumbs(breadcrumb);
       this.breadcrumbs = breadcrumb;
       this.breadcrumbService.setBreadcrumbs(breadcrumb);
    });
    this.route.data.subscribe(data => {

    });
  }

  toggleSubMenu(index: number) {
    this.activeSubMenu = this.activeSubMenu === index ? null : index;
  }
  newMaster(){
    this.createMaster.emit({});
  }
}
