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
import {FormsModule} from "@angular/forms";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {MyCommonModule} from "../../../common/common.module";
import {AdminRoutingModule} from "./admin.routing.module";
import {CreateAdminUserComponent} from "../../public/create-admin-user/create-admin-user.component";



@NgModule({
  declarations: [AdminComponent,GroupsComponent,UsersComponent],
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
  ]
})
export class AdminModule { }
