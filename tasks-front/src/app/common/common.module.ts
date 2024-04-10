import { NgModule } from '@angular/core';

import {TreeNodeItemComponent} from "./tree-node-item/tree-node-item.component";
import {CommonModule} from "@angular/common";
import {MaintenanceComponent} from "./maintenance/maintenance.component";
import {TreeDossierItemComponent} from "./tree-dossier-item/tree-dossier-item.component";


@NgModule({
  declarations: [
    TreeNodeItemComponent,MaintenanceComponent,TreeDossierItemComponent
  ],
  imports: [CommonModule],

  exports: [
    TreeNodeItemComponent,MaintenanceComponent,TreeDossierItemComponent
  ]
})
export class MyCommonModule { }
