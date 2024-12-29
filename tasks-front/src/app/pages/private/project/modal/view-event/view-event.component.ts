import { Component } from '@angular/core';
import {EventApp, Issue} from "../../../../../type/issue";
import {CustomFieldComponent} from "../../../../../common/custom-field/custom-field.component";
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {NgForOf, NgIf} from "@angular/common";
import {EventsService} from "../../../../../services/events.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../services/issue.service";
import {MyCommonModule} from "../../../../../common/common.module";

@Component({
  selector: 'app-view-event',
  templateUrl: './view-event.component.html',
  styleUrl: './view-event.component.css'
})
export class ViewEventComponent {
  event:EventApp
  constructor(
   private eventService:EventsService,
   private activeModal:NgbActiveModal,
   private issueService:IssueService
  ) {
  }
  loadEvent(eventId:number){
    this.eventService.getByEventById(eventId).subscribe(event=> {
      this.event = event;
    });
  }

  openEditIssue(issue: Issue) {
    this.issueService.openEditIssue(issue);
  }

  browseIssueMaster(parent: Issue) {
    this.issueService.browsIssueMaster(parent);
  }
}
