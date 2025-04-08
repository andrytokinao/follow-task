import {ChangeDetectorRef, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import {StatusComponent} from "./status/status.component";
import {RepartitionComponent} from "./repartition/repartition.component";
import {ProjectComponent} from "./project.component";
import {ProjectRoutingModule} from "./project-routing.module";
import {GanttChartComponent} from "./gantt-chart/gantt-chart.component";
import {BoardComponent} from "./board/board.component";
import {NewIssueComponent} from "./modal/new-issue/new-issue.component";
import {MatTabsModule} from "@angular/material/tabs";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule} from "@angular/forms";
import {MatMenuModule, MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {ViewEditIssueComponent} from "./modal/view-edit-issue/view-edit-issue.component";
import {MatSelectModule} from "@angular/material/select";
import {MyCommonModule} from "../../../common/common.module";
import {CalendarComponent} from "./calendar/calendar.component";
import {RapportComponent} from "./rapport/rapport.component";
import {CdkTextareaAutosize} from "@angular/cdk/text-field";
import {MatInputModule} from "@angular/material/input";
import {
  MatCell,
  MatCellDef,
  MatColumnDef, MatHeaderCell,
  MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow,
  MatRowDef,
  MatTable
} from "@angular/material/table";
import {MatPaginatorModule} from "@angular/material/paginator";
import {CustomFieldComponent} from "../../../common/custom-field/custom-field.component";
import {ShowMasterComponent} from "./show-master/show-master.component";
import {IssueMasterListComponent} from "./list/issue-master-list/simple-liste/issue-master-list.component";
import {DocumentComponent} from "./document/document.component";
import {MarkdownComponent} from "ngx-markdown";
import {ViewEventComponent} from "./modal/view-event/view-event.component";
import {DayPilotModule} from "@daypilot/daypilot-lite-angular";
import {PlanningIssueComponent} from "./modal/planning-issue/planning-issue.component";
import {ShowIssueOptionComponent} from "./modal/show-issue-option/show-issue-option.component";
import {ShowIssueFullOptionComponent} from "./modal/show-issue-full-option/show-issue-full-option.component";
import {MessagesComponent} from "./messages/messages.component";
import {MatCheckbox} from "@angular/material/checkbox";
import {NewDocumentComponent} from "./modal/new-document/new-document.component";
import {ExchangeDocumentsComponent} from "./exchange-documents/exchange-documents.component";
import {MatDivider} from "@angular/material/divider";

@NgModule({
  declarations: [
    StatusComponent,
    RepartitionComponent,
    ProjectComponent,
    GanttChartComponent,
    BoardComponent,
    CalendarComponent,
    RapportComponent,
    NewIssueComponent,
    ViewEditIssueComponent,
    DocumentComponent,
    ViewEventComponent,
    PlanningIssueComponent,
    ShowIssueOptionComponent,
    ShowIssueFullOptionComponent,
    MessagesComponent,
    NewDocumentComponent,
    ExchangeDocumentsComponent,

  ],
  exports: [
    StatusComponent, RepartitionComponent, ProjectComponent, ShowIssueOptionComponent, ShowIssueFullOptionComponent, ExchangeDocumentsComponent
  ],
  imports: [
    ProjectRoutingModule,
    MatTabsModule,
    MatCardModule,
    MatDialogModule,
    MatToolbarModule,
    MatFormFieldModule,
    FormsModule,
    MatMenuModule,
    MatMenuModule,
    MatIconModule,
    MatSelectModule,
    CommonModule,
    MyCommonModule,
    CdkTextareaAutosize,
    MatInputModule,
    MatTable,
    MatHeaderRowDef,
    MatRowDef,
    MatCellDef,
    MatHeaderCellDef,
    MatColumnDef,
    MatPaginatorModule,
    MatCell,
    MatHeaderCell,
    MatHeaderRow,
    MatRow,
    CustomFieldComponent,
    MarkdownComponent,
    DayPilotModule,
    MatCheckbox,
    MatDivider
  ]
})
export class ProjectModule { }
