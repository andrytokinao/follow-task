import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { DocumentService } from "../../services/document.service";
import {DocumentApp, DocumentUsageTypeMeta, Issue, IssueDocumentUsage, IssuePlanningSummary} from "../../type/issue";
import { IssueService } from "../../services/issue.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {SpinnerButtonComponent} from "../spinner-button/spinner-button.component";

@Component({
  selector: 'app-document-usage',
  imports: [CommonModule, FormsModule,SpinnerButtonComponent],
  templateUrl: './document-usage.component.html',
  styleUrl: './document-usage.component.css',
  encapsulation: ViewEncapsulation.None
})
export class DocumentUsageComponent implements OnInit, AfterViewInit {
  @ViewChild('saveBtn') saveBtn!: SpinnerButtonComponent;

  // ── Stepper state ──────────────────────────────────
  steps = ['Sélection', 'Usages', 'Confirmation'];
  currentStep = 0;

  // ── Data ───────────────────────────────────────────
  documentUsagesLabels: DocumentUsageTypeMeta[] = [];
  selectedUsages: DocumentUsageTypeMeta[] = [];
  issueDocumentUsage:IssueDocumentUsage[] = [];
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
    this.currentStep = 0;
    this._document = documentApp;
    this.issueDocumentUsage = null;
    this.issueDocumentUsage = this._document.issueUsages;
    this.selectIssue(null);
    this.selectedUsages = [];

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
    if (this.issueDocumentUsage) {
      const matched = this.issueDocumentUsage.filter(
        u => u.issue?.id === issue?.id
      );

      const usageValues = new Set<string>(
        matched.flatMap(u => u.usages ?? [u.usageType])
      );

      this.selectedUsages = this.documentUsagesLabels.filter(
        meta => usageValues.has(meta.value as string)
      );
    }
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
    this.saveBtn.state = 'loading';
    if (!this.selectedIssue || this.selectedUsages.length === 0) return;
    this.documentService.attachDocumentToIssue(
      this.selectedIssue.id,
      this._document.id,
      this.selectedUsages.map(su => su.value)
    ).subscribe(issueStats => {
          this.saveBtn.markSuccess(),
        this.onConfirmed.emit(issueStats);
    }, error => {
      this.saveBtn.markError();
    });
  }

}
