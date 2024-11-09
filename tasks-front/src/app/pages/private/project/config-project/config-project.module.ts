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
import {ConfigCustomFieldComponent} from "./config-custom-field/config-custom-field.component";
import {DataRowOutlet} from "@angular/cdk/table";
import {NewCustomFieldComponent} from "./config-custom-field/new-custom-field/new-custom-field.component";
import {MatListOption, MatSelectionList} from "@angular/material/list";
import {CdkDropList} from "@angular/cdk/drag-drop";
import {PopupCustomFieldComponent} from "./config-custom-field/popup-custom-field/popup-custom-field.component";
import {PopupWorkFlowComponent} from "./work-flow/popup-work-flow/popup-work-flow.component";
import {WorkFlowComponent} from "./work-flow/work-flow.component";
import {AccessibilityComponent} from "./accessibility/accessibility.component";
import {MatCheckbox} from "@angular/material/checkbox";

@NgModule({
  declarations: [
    ConfigProjectComponent,
    ProjectNameComponent,
    WorkFlowStatusComponent,
    DialogOverviewComponent,
    WorkFlowStatusComponent,
    IssueTypeComponent,
    PopupCustomFieldComponent,
    PopupWorkFlowComponent,
    WorkFlowComponent,
    AccessibilityComponent
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
        MatSelectionList,
        MatListOption,
        CdkDropList,
        MatCheckbox,
    ]
})
export class ConfigProjectModule { }
