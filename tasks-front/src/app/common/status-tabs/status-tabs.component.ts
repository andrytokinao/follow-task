import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Issue, Status} from "../../type/issue";
import {groupByStatus, resolveStatuses} from "../../type/issue-grouping.util";

interface StatusTab {
  status: Status;
  count: number;
}

/**
 * Statuts sélectionnables avec le nombre d'issues de chacun : la version
 * compacte d'un board, pour les espaces étroits. Sélection unique ; null
 * signifie "toutes", et un second clic sur le statut actif y revient.
 */
@Component({
  standalone: false,
  selector: 'app-status-tabs',
  templateUrl: './status-tabs.component.html',
  styleUrl: './status-tabs.component.css'
})
export class StatusTabsComponent implements OnChanges {
  /** statuts du workflow, dans l'ordre d'affichage */
  @Input() statuses: Status[] = [];
  @Input() issues: Issue[] = [];
  @Input() selectedId: number | null = null;
  @Output() selectedIdChange = new EventEmitter<number | null>();

  tabs: StatusTab[] = [];
  total = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['statuses'] || changes['issues']) {
      const grouped = groupByStatus(this.issues);
      this.tabs = resolveStatuses(this.statuses, this.issues)
        .map(status => ({status, count: grouped.get(status.id)?.length ?? 0}));
      this.total = (this.issues || []).length;
    }
  }

  select(statusId: number | null): void {
    this.selectedId = statusId;
    this.selectedIdChange.emit(statusId);
  }

  toggle(statusId: number): void {
    this.select(this.selectedId === statusId ? null : statusId);
  }

  trackByTab(_index: number, tab: StatusTab): number {
    return tab.status.id;
  }
}
