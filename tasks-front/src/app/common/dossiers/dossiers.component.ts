// ─── dossiers.component.ts ───────────────────────────────────────────────────

import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Repertoire} from "../../type/issue";
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-dossiers',
  standalone: false,
  templateUrl: './dossiers.component.html',
  styleUrl: './dossiers.component.css',
})
export class DossiersComponent implements OnInit, OnChanges {

  @Input() root: string = '';
  @Input() title: string = 'Explorateur de fichiers';
  repertoireApi = environment.apiURL +"api";

  rootRepertoire: Repertoire | null = null;
  repertoires:Repertoire[]= [];
  isLoading = false;
  error: string | null = null;


  lastSelectedPath = '';
  selectedPaths = new Set<string>();
  selectedItems: Repertoire[] = [];

  searchQuery = '';

  // ── Création de dossier ─────────────────────────────────────────────────────
  showCreateModal = false;
  newFolderName = '';
  createFolderError = '';

  // ── Toast ───────────────────────────────────────────────────────────────────
  toastMessage = '';
  toastVisible = false;
  private toastTimer: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.root) this.loadTree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['root'] && !changes['root'].firstChange) {
      this.loadTree();
    }
  }

  loadTree(): void {
    this.isLoading = true;
    this.error     = null;
    this.http.get<Repertoire[]>(this.repertoireApi+`/repertoires?path=${this.root}`)
      .subscribe({
        next: (data) => {
    //      alert(JSON.stringify(data));
          this.repertoires = data; this.isLoading = false;
        },

        error: (err) => {
          this.error     = 'Impossible de charger l\'arborescence.';
          this.isLoading = false;
          console.error(err);
        },
      });
  }

  onFileSelected(rep: Repertoire): void {
    this.lastSelectedPath = rep.absolutePath;
    // Sélection simple → réinitialise la multi-sélection
    this.selectedPaths.clear();
    this.selectedPaths.add(rep.absolutePath);
    this.selectedItems = [rep];
  }

  onSelectionToggled(rep: Repertoire): void {
    if (this.selectedPaths.has(rep.absolutePath)) {
      this.selectedPaths.delete(rep.absolutePath);
      this.selectedItems = this.selectedItems.filter(
        i => i.absolutePath !== rep.absolutePath
      );
    } else {
      this.selectedPaths.add(rep.absolutePath);
      this.selectedItems.push(rep);
    }
  }

  clearSelection(): void {
    this.selectedPaths.clear();
    this.selectedItems = [];
  }

  get hasSelection(): boolean {
    return this.selectedItems.length > 0;
  }

  get selectionLabel(): string {
    const n = this.selectedItems.length;
    return `${n} élément${n > 1 ? 's' : ''} sélectionné${n > 1 ? 's' : ''}`;
  }

  // ── Actions sur la sélection ────────────────────────────────────────────────
  actionDownload(): void {
    // Implémentez le téléchargement réel ici
    this.showToast(`Téléchargement de ${this.selectedItems.length} fichier(s)…`);
    this.clearSelection();
  }

  actionCopy(): void {
    const names = this.selectedItems.map(i => i.fileName).join(', ');
    this.showToast(`Copié : ${names}`);
    this.clearSelection();
  }

  actionMove(): void {
    this.showToast(`Déplacement de ${this.selectedItems.length} élément(s)…`);
    this.clearSelection();
  }

  actionShare(): void {
    this.showToast(`Lien de partage généré pour ${this.selectedItems.length} élément(s).`);
    this.clearSelection();
  }

  actionDelete(): void {
    if (!confirm(`Supprimer ${this.selectedItems.length} élément(s) ?`)) return;
    // Implémentez la suppression API ici
    this.showToast(`${this.selectedItems.length} élément(s) supprimé(s).`);
    this.clearSelection();
  }

  // ── Création de dossier ─────────────────────────────────────────────────────
  openCreateModal(): void {
    this.newFolderName   = '';
    this.createFolderError = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  confirmCreateFolder(): void {
    const name = this.newFolderName.trim();
    if (!name) { this.createFolderError = 'Le nom ne peut pas être vide.'; return; }
    if (/[/\\:*?"<>|]/.test(name)) { this.createFolderError = 'Nom invalide.'; return; }

    // Appel API réel
    // this.http.post('/api/folders', { parent: this.root, name }).subscribe(...)

    // Simulation locale
    if (this.rootRepertoire) {
      const newFolder: Repertoire = {
        fileName: name,
        absolutePath: `${this.root}/${name}`,
        path: name,
        repertoires: [],
        type: 'folder',
        selected: false,
        open: false,
        paths: [],
      };
      this.rootRepertoire.repertoires = [
        ...(this.rootRepertoire.repertoires ?? []),
        newFolder,
      ];
    }

    this.showToast(`Dossier "${name}" créé.`);
    this.closeCreateModal();
  }

  onModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter')  this.confirmCreateFolder();
    if (event.key === 'Escape') this.closeCreateModal();
  }

  // ── Toast ───────────────────────────────────────────────────────────────────
  showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastVisible = false), 3000);
  }
}
