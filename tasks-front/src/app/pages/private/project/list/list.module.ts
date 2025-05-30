import {ChangeDetectorRef, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

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
import {MatTabsModule} from "@angular/material/tabs";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {ListRoutingModule} from "./list-routing.module";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule} from "@angular/forms";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {MyCommonModule} from "../../../../common/common.module";
import {CustomFieldComponent} from "../../../../common/custom-field/custom-field.component";
import {ListComponent} from "./list.component";
import {IssueMasterListComponent} from "./issue-master-list/simple-liste/issue-master-list.component";
import {SimpleListeComponent} from "./subtask-list/issue-liste/simple-liste.component";
import {DataRowOutlet} from "@angular/cdk/table";
import {ShowListComponent} from "./subtask-list/show-list.component";
import {BoardListComponent} from "./subtask-list/board-list/board-list.component";
import {CalandarListComponent} from "./subtask-list/calendar-list/calandar-list.component";
import {DayPilotModule} from "@daypilot/daypilot-lite-angular";
import {ProjectModule} from "../project.module";
import {ShowMasterListComponent} from "./issue-master-list/show-master-list/show-master-list.component";
import {LabelFormComponent} from "../../../../common/label-form/label-form.component";
import {TableMasterComponent} from "./issue-master-list/table-master/table-master.component";
import {IssueBoaardComponent} from "./issue-boaard/issue-boaard.component";

@NgModule({
  declarations: [
    ListComponent,
    IssueMasterListComponent,
    SimpleListeComponent,
    ShowListComponent,
    BoardListComponent,
    CalandarListComponent,
    ShowMasterListComponent,
    TableMasterComponent,
    IssueBoaardComponent

  ],
    exports: [
        SimpleListeComponent
    ],
  imports: [
    ListRoutingModule,
    MatTabsModule,
    MatCardModule,
    MatDialogModule,
    MatToolbarModule,
    MatFormFieldModule,
    FormsModule,
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
    DataRowOutlet,
    DayPilotModule,
    ProjectModule,

  ]
})
export class ListModule { }
