import { Component, OnInit } from '@angular/core';
import {BreadcrumbService} from "../../services/breadcrumb.service";

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs = [];
  activeSubMenu: number | null = null;  // Pour identifier quel sous-menu est ouvert

  constructor(private breadcrumbService: BreadcrumbService) {}

  ngOnInit(): void {
    this.breadcrumbService.breadcrumbs.subscribe(breadcrumbs => {
      this.breadcrumbs = breadcrumbs;
    });
  }

  toggleSubMenu(index: number) {
    this.activeSubMenu = this.activeSubMenu === index ? null : index;
  }

}
