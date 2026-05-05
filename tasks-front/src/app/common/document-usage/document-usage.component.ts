import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DocumentService } from "../../services/document.service";
import { DocumentApp, DocumentUsageTypeMeta, Issue, IssuePlanningSummary } from "../../type/issue";
import { IssueService } from "../../services/issue.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-document-usage',
  imports: [CommonModule, FormsModule],
  templateUrl: './document-usage.component.html',
  styleUrl: './document-usage.component.css'
})
export class DocumentUsageComponent implements OnInit, AfterViewInit {

  // ── Stepper state ──────────────────────────────────
  steps = ['Sélection', 'Usages', 'Confirmation'];
  currentStep = 0;

  // ── Data ───────────────────────────────────────────
  documentUsagesLabels: DocumentUsageTypeMeta[] = [];
  selectedUsages: DocumentUsageTypeMeta[] = [];
  selectedIssue: Issue;
  issueOptions: Issue[] = [];
  searchIssue = '';
  _document: DocumentApp;
  _issueMaster: Issue;

  @Output() onIssueCreated = new EventEmitter<Issue>();
  @Output() onConfirmed = new EventEmitter<IssuePlanningSummary>();

  private issueMasterList: Issue[] = [];

  @Input() set issueMaster(issue: Issue) {
    this.issueOptions = [];
    this._issueMaster = issue;
    if (this._issueMaster?.id) {
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
    this.documentService.documentUsageTypes$.subscribe(types => {
      this.documentUsagesLabels = types;
    });
    this.issueService.issueMasterList$.subscribe(issues => {
      this.issueMasterList = issues;
      if (this.mode === 'MASTER') {
        this.issueOptions = issues;
      }
    });
  }

  // ── Stepper navigation ─────────────────────────────
  get filteredIssues(): Issue[] {
    const q = this.searchIssue?.toString().toLowerCase().trim();
    if (!q) return this.issueOptions;
    return this.issueOptions.filter(i =>
      i.issueKey?.toLowerCase().includes(q) ||
      i.summary?.toLowerCase().includes(q)
    );
  }

  canProceed(): boolean {
    if (this.currentStep === 0) return !!this.selectedIssue;
    if (this.currentStep === 1) return this.selectedUsages.length > 0;
    return true;
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goToStep(index: number): void {
    // Only allow going back to completed steps
    if (index < this.currentStep) {
      this.currentStep = index;
    }
  }

  // ── Issue selection ────────────────────────────────
  selectIssue(issue: Issue): void {
    this.selectedIssue = issue;
  }

  // ── Usage selection ────────────────────────────────
  isUsageSelected(usage: DocumentUsageTypeMeta): boolean {
    return this.selectedUsages.some(u => u.value === usage.value);
  }

  toggleUsage(usage: DocumentUsageTypeMeta): void {
    const idx = this.selectedUsages.findIndex(u => u.value === usage.value);
    if (idx > -1) {
      this.selectedUsages.splice(idx, 1);
    } else {
      this.selectedUsages.push(usage);
    }
  }

  // ── Actions ────────────────────────────────────────
  createNew(issue: Issue): void {
    this.onIssueCreated.emit(this.selectedIssue);
  }

  confirm(): void {
    if (!this.selectedIssue || this.selectedUsages.length === 0) return;
    this.documentService.attachDocumentToIssue(
      this.selectedIssue.id,
      this._document.id,
      this.selectedUsages.map(su => su.value)
    ).subscribe(issueStats => {
      this.onConfirmed.emit(issueStats);
    });
  }
}
