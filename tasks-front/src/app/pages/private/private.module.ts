import {PrivateRoutingModule} from "./private.routing.module";
import {PrivateComponent} from "./private.component";
import {NgModule} from "@angular/core";
import {MatTabsModule} from "@angular/material/tabs";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule} from "@angular/forms";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {CommonModule} from "@angular/common";
import {MyCommonModule} from "../../common/common.module";
import {ProfileComponent} from "./profile/profile.component";
import {AccessDeniedComponent} from "./access-denied/access-denied.component";


@NgModule({
  declarations: [
    PrivateComponent,
    ProfileComponent,
    AccessDeniedComponent
  ],
  imports: [
    PrivateRoutingModule,
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
  ],

})
export class PrivateModule { }
