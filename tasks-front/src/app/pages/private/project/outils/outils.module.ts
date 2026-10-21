import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatDialogModule} from '@angular/material/dialog';
import {MatMenuModule} from '@angular/material/menu';
import {MyCommonModule} from '../../../../common/common.module';
import {AvatarComponent} from '../../../../common/avatar/avatar.component';
import {OutilsRoutingModule} from './outils-routing.module';
import {OutilsPageComponent} from './outils-page/outils-page.component';
import {ChoixPorteeComponent} from './choix-portee/choix-portee.component';
import {DossierOutilDialogComponent} from './dossier-outil-dialog/dossier-outil-dialog.component';
import {OutilDialogComponent} from './outil-dialog/outil-dialog.component';
import {OutilFicheDialogComponent} from './outil-fiche-dialog/outil-fiche-dialog.component';

/** Menu Outils d'un espace de travail (DT-019), chargé à la première visite. */
@NgModule({
  declarations: [
    OutilsPageComponent,
    ChoixPorteeComponent,
    DossierOutilDialogComponent,
    OutilDialogComponent,
    OutilFicheDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatMenuModule,
    MyCommonModule,
    AvatarComponent,
    OutilsRoutingModule
  ]
})
export class OutilsModule {
}
