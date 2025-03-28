import {PrivateRoutingModule} from "./private.routing.module";
import {PrivateComponent} from "./private.component";
import {NgModule} from "@angular/core";
import {MatTabsModule} from "@angular/material/tabs";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {CommonModule} from "@angular/common";
import {MyCommonModule} from "../../common/common.module";
import {ProfileComponent} from "./profile/profile.component";
import {AccessDeniedComponent} from "./access-denied/access-denied.component";
import {HomeComponent} from "./home/home.component";
import {PopupCreateProjectComponent} from "./popup-create-project/popup-create-project.component";
import {CustomFieldComponent} from "../../common/custom-field/custom-field.component";
import {MatInputModule} from "@angular/material/input";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {BrowserModule} from "@angular/platform-browser";
import {MatRadioButton, MatRadioGroup} from "@angular/material/radio";
import {NgxColorsModule} from "ngx-colors";


@NgModule({
  declarations: [
    PrivateComponent,
    ProfileComponent,
    AccessDeniedComponent,
    HomeComponent,
    PopupCreateProjectComponent
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
        MatIconModule,
        MatSelectModule,
        CommonModule,
        MyCommonModule,
        CustomFieldComponent,
        MatInputModule,
        ReactiveFormsModule,
        MatRadioButton,
        MatRadioGroup,
        NgxColorsModule,
    ],

})
export class PrivateModule {}
