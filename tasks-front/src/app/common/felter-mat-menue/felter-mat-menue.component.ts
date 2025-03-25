import {Component, OnInit} from '@angular/core';
import {AsyncPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {MatMenuItem} from "@angular/material/menu";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../services/issue.service";
import {UserService} from "../../services/user.service";
import {AuthService} from "../../services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import {CustomFilter} from "../../type/issue-search-criteria.util";

@Component({
  standalone: false,
  selector: 'felter-mastert-menue',
  templateUrl: './felter-mat-menue.component.html',
  styleUrl: './felter-mat-menue.component.css'
})
export class FelterMatMenueComponent implements OnInit{
  masterFilter:CustomFilter[] = [];
  private selectedFilter: CustomFilter;

  constructor(
    private modalService: NgbModal,
    protected issueService: IssueService,
    private essueService: IssueService,
    public userService: UserService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {

  }
  ngOnInit(): void {
    this.issueService.masterFilters$.subscribe(filters => {
      this.masterFilter = filters;
    });

  }

  isActiveFilter(f: CustomFilter) {
    if (!this.selectedFilter ) {
      return false;
    }
     return this.selectedFilter.id === f.id;
  }

  selectFilter(f: CustomFilter) {
    this.selectedFilter = f;
    this.issueService.setCurrentMasterFilter(f);
  }
}
