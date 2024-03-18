import { NgModule } from '@angular/core';

import {TreeNodeItemComponent} from "./tree-node-item/tree-node-item.component";
import {CommonModule} from "@angular/common";


@NgModule({
  declarations: [
    TreeNodeItemComponent
  ],
  imports: [CommonModule],

  exports: [
    TreeNodeItemComponent
  ]
})
export class MyCommonModule { }
