import { NgModule } from '@angular/core';

import {TreeNodeItemComponent} from "./tree-node-item/tree-node-item.component";
import {CommonModule} from "@angular/common";
import {MaintenanceComponent} from "./maintenance/maintenance.component";


@NgModule({
  declarations: [
    TreeNodeItemComponent,MaintenanceComponent
  ],
  imports: [CommonModule],

  exports: [
    TreeNodeItemComponent,MaintenanceComponent
  ]
})
export class MyCommonModule { }
