import {Component, OnInit} from '@angular/core';
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {MyCommonModule} from "../common.module";
import {Label, Project} from "../../type/issue";
import {IssueService} from "../../services/issue.service";

@Component({
  selector: 'app-label-form',
  templateUrl: './label-form.component.html',
  styleUrl: './label-form.component.css'
})
export class LabelFormComponent implements OnInit{
  project:Project;
  labels:Label[] = [];
  constructor(private issueService:IssueService) {
  }

  ngOnInit(): void {
    this.issueService.project$.subscribe(project => {
      this.project = project;
      if (this.project?.id) {
        this.issueService.getLabelByProject(this.project.id)
      }
    });
    this.issueService.allLabel$.subscribe(labels => {
      this.labels = labels;
    })
  }
}
