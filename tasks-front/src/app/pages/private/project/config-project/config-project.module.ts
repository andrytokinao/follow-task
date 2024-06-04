import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import {ConfigProjectComponent} from "./config-project.component";
import {ProjectNameComponent} from "./project-name/project-name.component";
import {WorkFlowStatusComponent} from "./work-flow-status/work-flow-status.component";
import {DialogOverviewComponent} from "./dialog-overview/dialog-overview.component";
import {IssueTypeComponent} from "./issue-type/issue-type.component";
import {ConfigProjectRoutingModule} from "./config-project.routing.module";
import {CustomFieldComponent} from "./custom-field/custom-field.component";
import {DataRowOutlet} from "@angular/cdk/table";
import {EditCustomFieldComponent} from "./custom-field/edit-custom-field/edit-custom-field.component";

@NgModule({
  declarations: [
    ConfigProjectComponent,
    ProjectNameComponent,
    WorkFlowStatusComponent,
    DialogOverviewComponent,
    WorkFlowStatusComponent,
    IssueTypeComponent,
    CustomFieldComponent,
    EditCustomFieldComponent
  ],
  imports: [
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
    ConfigProjectRoutingModule,
    DataRowOutlet,
  ]
})
export class ConfigProjectModule { }
