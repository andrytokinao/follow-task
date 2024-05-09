import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";

import {ConfigurationComponent} from "./configuration.component";
import {BackupComponent} from "./backup/backup.component";
import {ArchiveComponent} from "./archive/archive.component";
import {SwitchVersionComponent} from "./switch-version/switch-version.component";
import {MediaSpaceComponent} from "./media-space/media-space.component";
import {WorkSpaceComponent} from "./work-space/work-space.component";

const configRoute: Routes = [
  // "/private/admin/config"
  {
    path: '',
    component: ConfigurationComponent,
    children: [
      {
        path: '',
        children: [
          { path: 'backup', component: ConfigurationComponent },
          { path: 'archive', component: ConfigurationComponent },
          { path: 'switch-version', component: ConfigurationComponent },
          { path: 'media-space', component: ConfigurationComponent },
          { path: 'work-space', component: ConfigurationComponent }
        ]
      }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(configRoute)],
  exports: [
    RouterModule]
})
export class ConfigurationRoutingModule { }
