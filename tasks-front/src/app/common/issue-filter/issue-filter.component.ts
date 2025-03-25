import { Component } from '@angular/core';
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {MatMenu, MatMenuItem, MatMenuTrigger, MenuPositionX} from "@angular/material/menu";
import {CustomFilter} from "../../type/issue-search-criteria.util";

@Component({
  standalone: false,
  selector: 'app-issue-filter',
  templateUrl: './issue-filter.component.html',
  styleUrl: './issue-filter.component.css'
})
export class IssueFilterComponent {
  filter:CustomFilter ={};
}
