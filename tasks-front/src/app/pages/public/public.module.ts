import {NgModule} from "@angular/core";
import {AboutComponent} from "./about/about.component";
import {HelpComponent} from "./help/help.component";
import {HomeComponent} from "./home/home.component";
import {LoginComponent} from "./login/login.component";
import {FormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatTabsModule} from "@angular/material/tabs";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {CommonModule} from "@angular/common";
import {MyCommonModule} from "../../common/common.module";
import {PublicComponent} from "./public.component";
import {PublicRoutingModule} from "./public-routing.module";
import {CreateAdminUserComponent} from "./create-admin-user/create-admin-user.component";



@NgModule({
  declarations: [
    AboutComponent,
    HelpComponent,
    HomeComponent,
    LoginComponent,
    PublicComponent,
    CreateAdminUserComponent
  ],
  exports: [

  ],
  imports: [
    PublicRoutingModule,
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
export class PublicModule { }
