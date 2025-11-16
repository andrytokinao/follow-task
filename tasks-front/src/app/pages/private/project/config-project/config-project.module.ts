import { NgModule } from '@angular/core';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {MatTabsModule} from "@angular/material/tabs";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldControl, MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
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
import {MatList, MatListItem, MatListOption, MatSelectionList} from "@angular/material/list";
import {CdkDrag, CdkDropList} from "@angular/cdk/drag-drop";
import {PopupCustomFieldComponent} from "./config-custom-field/popup-custom-field/popup-custom-field.component";
import {PopupWorkFlowComponent} from "./work-flow/popup-work-flow/popup-work-flow.component";
import {WorkFlowComponent} from "./work-flow/work-flow.component";
import {AccessibilityComponent} from "./accessibility/accessibility.component";
import {MatCheckbox} from "@angular/material/checkbox";
import {CustomFieldStepperComponent} from "./config-custom-field/custom-field-stepper/custom-field-stepper.component";
import {MatStep, MatStepper, MatStepperModule} from "@angular/material/stepper";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {IssueTypeStepperComponent} from "./issue-type/issue-type-stepper/issue-type-stepper.component";
import {MatRadioButton, MatRadioGroup} from "@angular/material/radio";
import {StepperWorkflowComponent} from "./work-flow/stepper-workflow/stepper-workflow.component";
import {IssueType2Component} from "./issue-type2/issue-type2.component";
import {IssutypeForm2Component} from "../../../../common/issutype-form2/issutype-form2.component";

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
    AccessibilityComponent,
    CustomFieldStepperComponent,
    IssueTypeStepperComponent,
    StepperWorkflowComponent,
    IssueType2Component

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
    MatStep,
    ReactiveFormsModule,
    MatStepper,
    MatInputModule,
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    CdkDropList,
    CdkDrag,
    MyCommonModule,
    NgForOf,
    NgIf,
    MatList,
    MatListItem,
    MatRadioButton,
    MatRadioGroup,
    IssutypeForm2Component,

  ]
})
export class ConfigProjectModule { }
