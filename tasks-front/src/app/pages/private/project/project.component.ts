import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Route} from "@angular/router";
import {IssueService} from "../../../services/issue.service";
import {Project} from "../../../type/issue";

@Component({
  selector: 'app-project',
  standalone: false,
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit{
  project:Project | undefined;
  constructor(
    private route:ActivatedRoute,
    private issueService:IssueService
  ) {
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.project = data['project'];
    });
  }
}
