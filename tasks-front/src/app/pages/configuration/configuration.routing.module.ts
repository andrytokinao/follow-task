import { NgModule } from '@angular/core';
import {RouterModule, Routes,provideRouter,withComponentInputBinding} from "@angular/router";

import {ConfigurationComponent} from "./configuration.component";
import {BackupComponent} from "./backup/backup.component";
import {ArchiveComponent} from "./archive/archive.component";
import {SwitchVersionComponent} from "./switch-version/switch-version.component";

const configRoute: Routes = [
  {
    path: '',
    component: ConfigurationComponent,
    children: [
      {
        path: '',
        children: [
          { path: 'backup', component: BackupComponent },
          { path: 'archive', component: ArchiveComponent },
          { path: 'switch-version', component: SwitchVersionComponent }
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
