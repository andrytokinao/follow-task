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
import {MyCommonModule} from "../../../common/common.module";
import {CreateProjectComponent} from "./create-project.component";
import {ProjectNameComponent} from "./project-name/project-name.component";
import {ProjectWorkflowComponent} from "./project-workflow/project-workflow.component";
import {CreateProjectRoutingModule} from "./create-project.routing.module";

@NgModule({
  declarations: [CreateProjectComponent,ProjectNameComponent,ProjectWorkflowComponent],
  imports: [
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
    CreateProjectRoutingModule
  ]
})
export class CreateProjectModule { }
