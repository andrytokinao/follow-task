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
import {ProjectRoutingModule} from "../project-routing.module";
import {MatTabsModule} from "@angular/material/tabs";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule} from "@angular/forms";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {MyCommonModule} from "../../../../common/common.module";
import {CustomFieldComponent} from "../../../../common/custom-field/custom-field.component";
import {CommentComponent} from "./comment/comment.component";
import {IssueMasterRoutingModule} from "./issue-master-routing.module";
import {ShowMasterComponent} from "./show-master.component";
import {SubtaskComponent} from "./subtask/subtask.component";
import {DetailsComponent} from "./details/details.component";
import {LivraisonComponent} from "./livraison/livraison.component";


@NgModule({
  declarations: [
    CommentComponent,
    ShowMasterComponent,
    SubtaskComponent,
    DetailsComponent,
    LivraisonComponent
  ],
  exports: [
  ],
    imports: [
      IssueMasterRoutingModule,
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
export class IssueMasterModule { }
