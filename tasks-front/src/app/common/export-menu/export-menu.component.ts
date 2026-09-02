import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import {ViewChild} from '@angular/core';
import {CustomField, Issue} from '../../type/issue';
import {IssueService} from '../../services/issue.service';
import {ExportService} from '../../services/export.service';

/** Une colonne proposée à l'export, cochable indépendamment. */
interface ExportColumn {
  key: string;
  label: string;
  selected: boolean;
  /** Champ personnalisé : regroupé à part dans le menu. */
  custom?: boolean;
}

/**
 * Bouton « Exporter » : choix des colonnes, puis le serveur produit le .xlsx.
 *
 * Le menu n'envoie que des clés de colonnes et les identifiants affichés ; la
 * lecture des valeurs se fait côté serveur, seul à connaître les heures
 * d'exécution (agrégées sur les événements de planning de la demande et de ses
 * sous-tâches) et l'avancement de chaque sous-tâche.
 *
 * L'export porte sur la liste qu'on lui passe : ce qui est filtré à l'écran est
 * ce qui part dans le fichier.
 */
@Component({
  standalone: true,
  selector: 'app-export-menu',
  imports: [CommonModule, MatMenuModule],
  templateUrl: './export-menu.component.html',
  styleUrl: './export-menu.component.css'
})
export class ExportMenuComponent implements OnInit {

  /** Lignes à exporter, déjà filtrées par l'hôte. */
  @Input() issues: Issue[] = [];

  /** Base du nom de fichier ; le serveur y ajoute la date et l'heure d'export. */
  @Input() fileName = 'export';
  @Input() sheetName = 'Demandes';
  @Input() label = 'Exporter';

  @ViewChild(MatMenuTrigger) private trigger?: MatMenuTrigger;

  columns: ExportColumn[] = [];
  /** Feuille « Sous-tâches » jointe au classeur. */
  includeSubtasks = true;
  exporting = false;
  error = '';

  /** Champs personnalisés du projet, pour proposer aussi les colonnes vides. */
  private projectFields: CustomField[] = [];

  constructor(
    private issueService: IssueService,
    private exportService: ExportService
  ) {
  }

  ngOnInit(): void {
    this.issueService.allCustomField$.subscribe(fields => {
      this.projectFields = fields ?? [];
      this.syncCustomColumns();
    });
    this.columns = this.standardColumns();
  }

  // -----------------------------------------------------------------------
  // Colonnes
  // -----------------------------------------------------------------------

  /** Les clés doivent correspondre à celles du serveur (`ExportService`). */
  private standardColumns(): ExportColumn[] {
    return [
      {key: 'key', label: 'Clé', selected: true},
      {key: 'summary', label: 'Titre', selected: true},
      {key: 'type', label: 'Type', selected: true},
      {key: 'status', label: 'Statut', selected: true},
      {key: 'assignee', label: 'Assigné', selected: true},
      {key: 'labels', label: 'Tags', selected: true},
      {key: 'progress', label: 'Avancement (%)', selected: true},
      {key: 'created', label: 'Créée le', selected: true},
      // Heures d'exécution : le serveur les agrège sur la demande et ses
      // sous-tâches, elles ne sont pas dans la liste affichée.
      {key: 'hoursTotal', label: 'Heures planifiées', selected: true},
      {key: 'hoursSpent', label: 'Heures réalisées', selected: true},
      {key: 'hoursRemaining', label: 'Heures restantes', selected: false},
      {key: 'updated', label: 'Mise à jour', selected: false},
      {key: 'reporter', label: 'Rapporteur', selected: false},
      {key: 'children', label: 'Sous-tâches', selected: false},
      {key: 'description', label: 'Description', selected: false},
    ];
  }

  /**
   * Reconstruit les colonnes « champ personnalisé » à partir du projet et des
   * demandes affichées, en conservant les cases déjà cochées.
   */
  private syncCustomColumns(): void {
    const checked = new Set(this.columns.filter(c => c.custom && c.selected).map(c => c.key));
    const standard = this.columns.filter(c => !c.custom);

    const fields = new Map<number, CustomField>();
    for (const field of this.projectFields) {
      if (field?.id != null) {
        fields.set(field.id, field);
      }
    }
    // Un champ retiré du projet mais encore porté par une demande resterait
    // invisible : on complète avec ce que les lignes contiennent réellement.
    for (const issue of this.issues ?? []) {
      for (const value of issue.values ?? []) {
        const field = value?.customField;
        if (field?.id != null && !fields.has(field.id)) {
          fields.set(field.id, field);
        }
      }
    }

    const customColumns = [...fields.values()]
      .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')))
      .map(field => ({
        key: 'cf-' + field.id,
        label: field.name ?? 'Champ',
        selected: checked.has('cf-' + field.id),
        custom: true
      } as ExportColumn));

    this.columns = [...standard, ...customColumns];
  }

  get standard(): ExportColumn[] {
    return this.columns.filter(column => !column.custom);
  }

  get customFields(): ExportColumn[] {
    return this.columns.filter(column => column.custom);
  }

  get selectedCount(): number {
    return this.columns.filter(column => column.selected).length;
  }

  get canExport(): boolean {
    return this.selectedCount > 0 && (this.issues?.length ?? 0) > 0;
  }

  toggle(column: ExportColumn): void {
    column.selected = !column.selected;
  }

  /** Bascule groupée : tout décocher si tout est coché, tout cocher sinon. */
  toggleAll(columns: ExportColumn[]): void {
    const target = !columns.every(column => column.selected);
    columns.forEach(column => column.selected = target);
  }

  allSelected(columns: ExportColumn[]): boolean {
    return columns.length > 0 && columns.every(column => column.selected);
  }

  onMenuOpened(): void {
    this.syncCustomColumns();
  }

  // -----------------------------------------------------------------------
  // Export
  // -----------------------------------------------------------------------

  exportXlsx(): void {
    if (!this.canExport || this.exporting) {
      return;
    }
    this.exporting = true;
    this.error = '';

    this.exportService.downloadIssues({
      issueIds: (this.issues ?? [])
        .map(issue => issue.id)
        .filter((id): id is number => id != null),
      // L'ordre des clés est celui des colonnes du menu : c'est celui du fichier.
      columns: this.columns.filter(column => column.selected).map(column => column.key),
      sheetName: this.sheetName,
      includeSubtasks: this.includeSubtasks
    }, this.fileName || 'export').subscribe({
      next: () => {
        this.exporting = false;
        this.trigger?.closeMenu();
      },
      error: () => {
        this.exporting = false;
        this.error = "L'export a échoué.";
      }
    });
  }
}
