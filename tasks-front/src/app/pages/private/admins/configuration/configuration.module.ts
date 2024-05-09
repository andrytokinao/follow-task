import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SwitchVersionComponent} from "./switch-version/switch-version.component";
import {ArchiveComponent} from "./archive/archive.component";
import {MyCommonModule} from "../../../../common/common.module";
import {BackupComponent} from "./backup/backup.component";
import {ConfigEntry} from "../../../../type/issue";
import {Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../services/config.service";
import {WorkSpaceComponent} from "./work-space/work-space.component";
import {MediaSpaceComponent} from "./media-space/media-space.component";
import {ConfigurationComponent} from "./configuration.component";
import {InstallDataComponent} from "./install-data/install-data.component";
import {ConfigurationRoutingModule} from "./configuration.routing.module";
import {AdminRoutingModule} from "../admin.routing.module";
import {MatTabsModule} from "@angular/material/tabs";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule} from "@angular/forms";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";

@NgModule({
  declarations: [
    SwitchVersionComponent,
    ArchiveComponent,
    BackupComponent,
    MediaSpaceComponent,
    WorkSpaceComponent,
    ConfigurationComponent,
    InstallDataComponent
  ],
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
    ConfigurationRoutingModule
  ]
})
export class ConfigurationModule {

}
