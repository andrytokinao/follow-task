import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MyCommonModule} from "../../common/common.module";
import {InstallDataComponent} from "./install-data/install-data.component";
import {WorkSpaceComponent} from "./work-space/work-space.component";
import {InstallationRoutingModule} from "./installation.routing.module";
import {InstallationComponent} from "./installation.component";
import {CreateAdminUserComponent} from "./create-admin-user/create-admin-user.component";
import {MatTabsModule} from "@angular/material/tabs";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule} from "@angular/forms";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {MediaSpaceComponent} from "./media-space/media-space.component";
import {CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA} from "@angular/compiler";
import {CreateProjectComponent} from "./create-project/create-project.component";



@NgModule({
  declarations: [InstallDataComponent,MediaSpaceComponent,WorkSpaceComponent, InstallationComponent,CreateAdminUserComponent],
  imports: [
    InstallationRoutingModule,
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
  ],
})
export class InstallationModule { }
