import {ChangeDetectorRef, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import {StatusComponent} from "./status/status.component";
import {RepartitionComponent} from "./repartition/repartition.component";
import {IssueListeComponent} from "./issue-liste/issue-liste.component";
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
    ViewEditIssueComponent
  ],
  exports: [
     StatusComponent, RepartitionComponent,ProjectComponent
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
        CustomFieldComponent
    ]
})
export class ProjectModule { }
