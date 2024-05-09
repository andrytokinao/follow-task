import {CUSTOM_ELEMENTS_SCHEMA, forwardRef, NgModule} from '@angular/core';

import {TreeNodeItemComponent} from "./tree-node-item/tree-node-item.component";
import {CommonModule} from "@angular/common";
import {MaintenanceComponent} from "./maintenance/maintenance.component";
import {TreeDossierItemComponent} from "./tree-dossier-item/tree-dossier-item.component";
import {TextFieldComponent} from "./text-field/text-field.component";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {MatFormFieldModule} from "@angular/material/form-field";
import {TelFieldComponent} from "./tel-field/tel-field.component";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import  {FormsModule,ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";

@NgModule({
  declarations: [
    TreeNodeItemComponent,
    MaintenanceComponent,
    TreeDossierItemComponent,
    TextFieldComponent,
    TelFieldComponent,

  ],
  imports: [
    CommonModule,
    MatMenuModule,
    MatMenuModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatDialogModule,
    MatToolbarModule,
    MatSelectModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  exports: [
    TreeNodeItemComponent,
    MaintenanceComponent,
    TreeDossierItemComponent,
    TextFieldComponent,
    TelFieldComponent,
  ]
})
export class MyCommonModule { }
