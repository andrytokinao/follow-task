import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SwitchVersionComponent} from "./switch-version/switch-version.component";
import {InstallationComponent} from "../installation/installation.component";
import {ArchiveComponent} from "./archive/archive.component";
import {MyCommonModule} from "../../common/common.module";
import {BackupComponent} from "./backup/backup.component";



@NgModule({
  declarations: [SwitchVersionComponent,ArchiveComponent,BackupComponent],
  imports: [
    CommonModule,
    MyCommonModule
  ]
})
export class ConfigurationModule { }
