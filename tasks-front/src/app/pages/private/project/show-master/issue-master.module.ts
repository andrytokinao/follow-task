import {ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

import {CdkTextareaAutosize} from "@angular/cdk/text-field";
import {MatInputModule} from "@angular/material/input";
import {
  MatCell,
  MatCellDef,
  MatColumnDef, MatHeaderCell,
  MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow,
  MatRowDef,
  MatTable
} from "@angular/material/table";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatTabsModule} from "@angular/material/tabs";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule} from "@angular/forms";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {MyCommonModule} from "../../../../common/common.module";
import {CustomFieldComponent} from "../../../../common/custom-field/custom-field.component";
import {IssueMasterRoutingModule} from "./issue-master-routing.module";
import {ShowMasterComponent} from "./show-master.component";
import {SubtaskComponent} from "./subtask/subtask.component";
import {UploadedFilesComponent} from "./uploaded-file/uploaded-files.component";
import {MatChip, MatChipsModule} from "@angular/material/chips";
import {MatCheckbox, MatCheckboxModule} from "@angular/material/checkbox";
import {MatButtonModule} from "@angular/material/button";
import {MatDivider} from "@angular/material/divider";
import {IssueDetailsComponent} from "./issue-details/issue-details.component";
import {PlanningComponent} from "./planning/planning.component";
import {PlanningModule} from "../planning/planning.module";
import {FileListComponent} from "./file-list/file-list.component";
import {DossierSourceComponent} from "./dossier-sources/dossier-source.component";
import {CommentsComponent} from "./comments/comments.component";
import {IssueChatsComponent} from "./issue-chats/issue-chats.component";
import {QuillEditorComponent} from "ngx-quill";
import {DocumentsComponent} from "./documents/documents.component";
import {
  MatExpansionModule,
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import {DocumentUploaderComponent} from "./document-uploader/document-uploader.component";
import {MatAutocomplete, MatAutocompleteTrigger} from "@angular/material/autocomplete";
import {ExchangeDocumentsComponent} from "../exchange-documents/exchange-documents.component";
import {DiscussionComponent} from "./discussion/discussion.component";
import {ProjectModule} from "../project.module";
import {Subtask2Component} from "./subtask-2/subtask-2.component";
import {MatListItem, MatNavList} from "@angular/material/list";
import {AngularSplitModule} from "angular-split";
import {AddNewValueComponent} from "../../../../common/add-new-value/add-new-value.component";
import {
    IssueDocumentsViewerComponent
} from "../../../../common/issue-documents-viewer/issue-documents-viewer.component";


@NgModule({
  declarations: [
    ShowMasterComponent,
    SubtaskComponent,
    UploadedFilesComponent,
    IssueDetailsComponent,
    PlanningComponent,
    FileListComponent,
    DossierSourceComponent,
    CommentsComponent,
    IssueChatsComponent,
    DocumentsComponent,
    DocumentUploaderComponent,
    DiscussionComponent,
    Subtask2Component
  ],
  exports: [
  ],
    imports: [
        IssueMasterRoutingModule,
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
        CdkTextareaAutosize,
        MatInputModule,
        MatTable,
        MatHeaderRowDef,
        MatRowDef,
        MatCellDef,
        MatHeaderCellDef,
        MatColumnDef,
        MatPaginatorModule,
        MatCell,
        MatHeaderCell,
        MatHeaderRow,
        MatRow,
        CustomFieldComponent,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatChipsModule,
        MatDivider,
        PlanningModule,
        QuillEditorComponent,
        MatExpansionPanel,
        MatExpansionPanelTitle,
        MatExpansionPanelDescription,
        MatExpansionModule,
        MatAutocomplete,
        MatAutocompleteTrigger,
        MatCheckbox,
        ProjectModule,
        MatNavList,
        MatListItem,
        AngularSplitModule,
        AddNewValueComponent,
        IssueDocumentsViewerComponent
    ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class IssueMasterModule { }
