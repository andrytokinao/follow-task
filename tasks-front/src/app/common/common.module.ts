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
import {AssignFieldComponent} from "./assign-field/assign-field.component";
import {MatAutocomplete, MatAutocompleteTrigger} from "@angular/material/autocomplete";
import {BreadcrumbComponent} from "./navigation/breadcrumb.component";
import {RouterLink, RouterLinkActive} from "@angular/router";
import {StatusFieldComponent} from "./status-field/status-field.component";
import {EditEventComponent} from "./edit-event/edit-event.component";
import {NewEventComponent} from "./new-event/new-event.component";
import {IssueFilterFieldComponent} from "./issue-filter-field/issue-filter-field.component";
import {MatCheckbox} from "@angular/material/checkbox";
import {QuillEditorComponent} from "ngx-quill";
import {EditorComponent} from "./quill-editor/quill-editor.component";
import {PdfOverviewComponent} from "./pdf-overview/pdf-overview.component";
import {NgxExtendedPdfViewerModule} from "ngx-extended-pdf-viewer";
import {NgbActiveModal, NgbCarousel, NgbCollapse, NgbSlide} from "@ng-bootstrap/ng-bootstrap";
import {DocViewerComponent} from "./doc-viewer/doc-viewer.component";
import {NgxDocViewerModule} from "ngx-doc-viewer";
import {IssueFilterComponent} from "./issue-filter/issue-filter.component";
import {IssueMasterBreadcrumbComponent} from "./issue-master-breadcrumb/issue-master-breadcrumb.component";
import {LoadingComponent} from "./loading/loading.component";
import {LabelFormComponent} from "./label-form/label-form.component";
import {FelterMatMenueComponent} from "./felter-mat-menue/felter-mat-menue.component";
import {NgxColorsModule} from "ngx-colors";
import {ConfirmationDialogComponent} from "./confirmation-dialog/confirmation-dialog.component";
import {DocumentMenuComponent} from "./document-menu/document-menu.component";
import {NotificationsComponent} from "./notifications/notifications.component";
import {TeamAvatarsComponent} from "./team-avatars/team-avatars.component";
import {ImageModalContentComponent} from "./image-modal-content/image-modal-content.component";
import {ChatWidgetComponent} from "./chat-widget/chat-widget.component";
import {NewIssueFormComponent} from "./new-issue-form/new-issue-form.component";
import {LoadingOverlayComponent} from "./loading-overlay/loading-overlay.component";
import {SkeletonComponent} from "./skeleton/skeleton.component";
import {IssutypeForm2Component} from "./issutype-form2/issutype-form2.component";

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
    StatesFormComponent,
    AssignFieldComponent,
    BreadcrumbComponent,
    StatusFieldComponent,
    EditEventComponent,
    NewEventComponent,
    IssueFilterFieldComponent,
    EditorComponent,
    PdfOverviewComponent,
    DocViewerComponent,
    IssueFilterComponent,
    IssueMasterBreadcrumbComponent,
    LoadingComponent,
    LabelFormComponent,
  FelterMatMenueComponent,
    ConfirmationDialogComponent,
    DocumentMenuComponent,
    NotificationsComponent,
    TeamAvatarsComponent,
    ImageModalContentComponent,
    ChatWidgetComponent,
    NewIssueFormComponent,
    LoadingOverlayComponent,
    SkeletonComponent

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
    NgClass,
    ReactiveFormsModule,
    MatAutocompleteTrigger,
    MatAutocomplete,
    RouterLink,
    MatCheckbox,
    QuillEditorComponent,
    NgxExtendedPdfViewerModule,
    NgbCollapse,
    NgxDocViewerModule,
    RouterLinkActive,
    NgxColorsModule,
    NgbCarousel,
    NgbSlide,
    IssutypeForm2Component
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
    StatesFormComponent,
    AssignFieldComponent,
    BreadcrumbComponent,
    StatusFieldComponent,
    EditEventComponent,
    NewEventComponent,
    QuillEditorComponent,
    EditorComponent,
    PdfOverviewComponent,
    DocViewerComponent,
    IssueFilterComponent,
    IssueMasterBreadcrumbComponent,
    LoadingComponent,
    LabelFormComponent,
    FelterMatMenueComponent,
    DocumentMenuComponent,
    NotificationsComponent,
    TeamAvatarsComponent,
    ImageModalContentComponent,
    ChatWidgetComponent,
    NewIssueFormComponent,
    LoadingOverlayComponent,
    SkeletonComponent
  ],
  providers:[
    NgbActiveModal
  ]
})
export class MyCommonModule { }
