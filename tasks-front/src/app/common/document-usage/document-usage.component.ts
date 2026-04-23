import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DocumentService } from "../../services/document.service";
import { DocumentApp, DocumentUsageTypeMeta, Issue } from "../../type/issue";
import { IssueService } from "../../services/issue.service";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-document-usage',
  imports: [CommonModule,FormsModule],
  templateUrl: './document-usage.component.html',
  styleUrl: './document-usage.component.css'
})
export class DocumentUsageComponent implements OnInit, AfterViewInit {
  documentUsagesLabels: DocumentUsageTypeMeta[] = [];
  selectedUsages: DocumentUsageTypeMeta[] = [];
  selectedIssue: Issue;
  issueOptions: Issue[] = [];
  searchIssue: String = '';
  _document: DocumentApp;
  _issueMaster: Issue;

  @Output() onCreated = new EventEmitter<Issue>();
  @Output() onConfirmed = new EventEmitter<{ issue: Issue; usages: DocumentUsageTypeMeta[] }>();

  private issueMasterList: Issue[] = [];

  @Input() set issueMaster(issue: Issue) {
    this.issueOptions = [];
    this._issueMaster = issue;
    if (this._issueMaster && this._issueMaster.id) {
      this.mode = 'SAB_TASK';
      this.issueService.loadSubtask(this._issueMaster.id).subscribe(issues => this.issueOptions = issues);
    } else {
      this.mode = 'MASTER';
      this.issueOptions = this.issueMasterList;
    }
  }

  @Input() set documentApp(documentApp: DocumentApp) {
    this._document = documentApp;
  }

  @Input() mode: 'MASTER' | 'SAB_TASK' = 'MASTER';

  constructor(
    private documentService: DocumentService,
    private issueService: IssueService
  ) {}

  ngAfterViewInit(): void {}

  ngOnInit(): void {
    this.documentService.documentUsageTypes$.subscribe(
      types => this.documentUsagesLabels = types
    );
    this.issueService.issueMasterList$.subscribe(issues => {
      this.issueMasterList = issues;
      if (this.mode === 'MASTER') {
        this.issueOptions = issues;
      }
    });
  }

  selectIssue(issue: Issue): void {
    this.selectedIssue = issue;
  }

  isUsageSelected(usage: DocumentUsageTypeMeta): boolean {
    return this.selectedUsages.some(u => u.label === usage.label);
  }

  toggleUsage(usage: DocumentUsageTypeMeta): void {
    const idx = this.selectedUsages.findIndex(u => u.label === usage.label);
    if (idx > -1) {
      this.selectedUsages.splice(idx, 1);
    } else {
      this.selectedUsages.push(usage);
    }
  }

  createNew(): void {
    this.onCreated.emit(new Issue());
  }

  confirm(): void {
    if (!this.selectedIssue || this.selectedUsages.length === 0) return;
    this.documentService.useDocumentForIssue(this.selectedIssue.id,this._document.id,this.selectedUsages.map(su=>su.label)).subscribe( issueStats => {

    })
    this.onConfirmed.emit({
      issue: this.selectedIssue,
      usages: this.selectedUsages
    });
  }

}
