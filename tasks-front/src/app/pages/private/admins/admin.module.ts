import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AdminComponent} from "./admin.component";
import {GroupsComponent} from "./groups/groups.component";
import {UsersComponent} from "./users/users.component";
import {MatTabsModule} from "@angular/material/tabs";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {MyCommonModule} from "../../../common/common.module";
import {AdminRoutingModule} from "./admin.routing.module";
import {CreateAdminUserComponent} from "../../public/create-admin-user/create-admin-user.component";
import {AddMamberGroupeComponent} from "./groups/add-mamber-groupe/add-mamber-groupe.component";
import {MatAutocomplete, MatAutocompleteTrigger} from "@angular/material/autocomplete";
import {MatInputModule} from "@angular/material/input";
import {MatGridList, MatGridTile} from "@angular/material/grid-list";
import {MatCheckbox} from "@angular/material/checkbox";



@NgModule({
  declarations: [AdminComponent,GroupsComponent,UsersComponent,AddMamberGroupeComponent],
  imports: [
    AdminRoutingModule,
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
    ReactiveFormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatGridList,
    MatGridTile,
    MatCheckbox,
  ],
})
export class AdminModule { }
