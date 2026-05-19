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
import { DocumentApp, DocumentUsageTypeMeta, Issue, IssueDocumentUsage, IssuePlanningSummary } from "../../type/issue";
import { IssueService } from "../../services/issue.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SpinnerButtonComponent } from "../spinner-button/spinner-button.component";

interface BreadcrumbEntry {
  issue: Issue | null; // null = root
  label: string;
}

@Component({
  selector: 'app-document-usage',
  imports: [CommonModule, FormsModule, SpinnerButtonComponent],
  templateUrl: './document-usage.component.html',
  styleUrl: './document-usage.component.css',
  encapsulation: ViewEncapsulation.None
})
export class DocumentUsageComponent implements OnInit, AfterViewInit {
  @ViewChild('saveBtn') saveBtn!: SpinnerButtonComponent;

  // ── Stepper ────────────────────────────────────────
  steps = ['Sélection', 'Usages', 'Confirmation'];
  currentStep = 0;

  // ── Data ───────────────────────────────────────────
  documentUsagesLabels: DocumentUsageTypeMeta[] = [];
  selectedUsages: DocumentUsageTypeMeta[] = [];
  issueDocumentUsage: IssueDocumentUsage[] = [];
  selectedIssue: Issue | null = null;
  issueOptions: Issue[] = [];
  searchIssue = '';
  loadingChildren = false;

  _document: DocumentApp;

  // ── Breadcrumb / folder navigation ────────────────
  breadcrumb: BreadcrumbEntry[] = [{ issue: null, label: 'Projets' }];

  @Output() onIssueCreated = new EventEmitter<Issue>();
  @Output() onConfirmed = new EventEmitter<IssuePlanningSummary>();

  private rootIssues: Issue[] = [];

  // ── Computed helpers ───────────────────────────────
  get currentParent(): Issue | null {
    return this.breadcrumb[this.breadcrumb.length - 1].issue;
  }

  get isAtRoot(): boolean {
    return this.breadcrumb.length === 1;
  }

  get depthLabel(): string {
    if (this.isAtRoot) return 'Projet';
    return `Niveau ${this.breadcrumb.length}`;
  }

  // ── Inputs ─────────────────────────────────────────
  @Input() set documentApp(documentApp: DocumentApp) {
    this.currentStep = 0;
    this._document = documentApp;
    this.issueDocumentUsage = documentApp?.issueUsages ?? [];
    this.selectIssue(null);
    this.selectedUsages = [];
    this.resetNavigation();
  }

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
      this.rootIssues = issues;
      if (this.isAtRoot) {
        this.issueOptions = issues;
      }
    });
  }

  // ── Navigation ─────────────────────────────────────

  /** Navigate into a parent item (open its children) */
  openChildren(issue: Issue, event: Event): void {
    event.stopPropagation();
    this.loadingChildren = true;
    this.searchIssue = '';
    this.issueService.loadSubtask(issue.id).subscribe({
      next: (children) => {
        this.issueOptions = children;
        this.breadcrumb.push({ issue, label: issue.issueKey?.toString() ?? issue.summary?.toString() ?? 'Sous-tâches' });
        this.loadingChildren = false;
      },
      error: () => { this.loadingChildren = false; }
    });
  }

  /** Navigate to a specific breadcrumb level */
  navigateTo(index: number): void {
    if (index >= this.breadcrumb.length - 1) return;
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    this.searchIssue = '';
    const entry = this.breadcrumb[index];
    if (entry.issue === null) {
      this.issueOptions = this.rootIssues;
    } else {
      this.loadingChildren = true;
      this.issueService.loadSubtask(entry.issue.id).subscribe({
        next: (children) => { this.issueOptions = children; this.loadingChildren = false; },
        error: () => { this.loadingChildren = false; }
      });
    }
    // Deselect if selected issue is no longer in current level
    if (this.selectedIssue && !this.issueOptions.find(i => i.id === this.selectedIssue?.id)) {
      this.selectIssue(null);
    }
  }

  private resetNavigation(): void {
    this.breadcrumb = [{ issue: null, label: 'Projets' }];
    this.issueOptions = this.rootIssues;
    this.searchIssue = '';
  }

  // ── Filtered list ──────────────────────────────────
  get filteredIssues(): Issue[] {
    const q = this.searchIssue?.toString().toLowerCase().trim();
    if (!q) return this.issueOptions;
    return this.issueOptions.filter(i =>
      i.issueKey?.toLowerCase().includes(q) ||
      i.summary?.toLowerCase().includes(q)
    );
  }

  // ── Stepper ────────────────────────────────────────
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
    if (this.currentStep > 0) this.currentStep--;
  }

  goToStep(index: number): void {
    if (index < this.currentStep) this.currentStep = index;
  }

  // ── Issue selection ────────────────────────────────
  selectIssue(issue: Issue | null): void {
    this.selectedIssue = issue;
    if (this.issueDocumentUsage && issue) {
      const matched = this.issueDocumentUsage.filter(u => u.issue?.id === issue.id);
      const usageValues = new Set<string>(matched.flatMap(u => u.usages ?? [u.usageType]));
      this.selectedUsages = this.documentUsagesLabels.filter(meta => usageValues.has(meta.value as string));
    } else {
      this.selectedUsages = [];
    }
  }

  // ── Usage selection ────────────────────────────────
  isUsageSelected(usage: DocumentUsageTypeMeta): boolean {
    return this.selectedUsages.some(u => u.value === usage.value);
  }

  toggleUsage(usage: DocumentUsageTypeMeta): void {
    const idx = this.selectedUsages.findIndex(u => u.value === usage.value);
    if (idx > -1) this.selectedUsages.splice(idx, 1);
    else this.selectedUsages.push(usage);
  }

  // ── Actions ────────────────────────────────────────
  createNew(): void {
    this.onIssueCreated.emit(this.selectedIssue ?? undefined);
  }

  confirm(): void {
    this.saveBtn.state = 'loading';
    if (!this.selectedIssue || this.selectedUsages.length === 0) return;
    this.documentService.attachDocumentToIssue(
      this.selectedIssue.id,
      this._document.id,
      this.selectedUsages.map(su => su.value)
    ).subscribe({
      next: (issueStats) => {
        this.saveBtn.markSuccess();
        this.onConfirmed.emit(issueStats);
      },
      error: () => this.saveBtn.markError()
    });
  }

  get selectionPath(): string {
    if (!this.selectedIssue) return '';
    const parts = this.breadcrumb.slice(1).map(b => b.label);
    parts.push(this.selectedIssue.issueKey?.toString() ?? this.selectedIssue.summary?.toString() ?? '');
    return parts.join(' › ');
  }
}
