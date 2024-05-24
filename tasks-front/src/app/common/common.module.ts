import {CUSTOM_ELEMENTS_SCHEMA, forwardRef, NgModule} from '@angular/core';

import {TreeNodeItemComponent} from "./tree-node-item/tree-node-item.component";
import {CommonModule, NgClass, NgIf} from "@angular/common";
import {MaintenanceComponent} from "./maintenance/maintenance.component";
import {TreeDossierItemComponent} from "./tree-dossier-item/tree-dossier-item.component";
import {TextFieldComponent} from "./text-field/text-field.component";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {MatFormField, MatFormFieldModule, MatLabel} from "@angular/material/form-field";
import {TelFieldComponent} from "./tel-field/tel-field.component";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import  {FormsModule,ReactiveFormsModule} from "@angular/forms";
import {MatInput, MatInputModule} from "@angular/material/input";
import {InstallationComponent} from "./installation/installation.component";
import {IconeFieldComponent} from "./icone-field/icone-field.component";
import {IconeViewComponent} from "./icone-view/icone-view.component";
import {MatButtonModule} from "@angular/material/button";
import {CustomfieldFormComponent} from "./form/customfield-form/customfield-form.component";
import {GroupeFormComponent} from "./form/groupe-form/groupe-form.component";
import {IssuetypeFormComponent} from "./issuetype-form/issuetype-form.component";
import {StatesFormComponent} from "./states-form/states-form.component";

@NgModule({
  declarations: [
    TreeNodeItemComponent,
    MaintenanceComponent,
    TreeDossierItemComponent,
    TextFieldComponent,
    TelFieldComponent,
    InstallationComponent,
    IconeFieldComponent,
    IconeViewComponent,
    GroupeFormComponent,
    CustomfieldFormComponent,
    IssuetypeFormComponent,
    StatesFormComponent

  ],
  imports: [
    CommonModule,
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
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    NgIf,
    NgClass
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
    InstallationComponent,
    IconeFieldComponent,
    IconeViewComponent,
    GroupeFormComponent,
    CustomfieldFormComponent,
    IssuetypeFormComponent,
    StatesFormComponent
  ]
})
export class MyCommonModule { }
