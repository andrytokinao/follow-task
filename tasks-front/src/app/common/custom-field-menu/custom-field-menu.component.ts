import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import {CustomField, CustomFieldValue, Issue} from '../../type/issue';
import {IssueService} from '../../services/issue.service';
import {ProjectGuard} from '../../services/ProjectGuard';
import {CustomFieldComponent} from '../custom-field/custom-field.component';

/** Les trois écrans du menu, affichés tour à tour dans le même panneau. */
type MenuStep = 'list' | 'create' | 'value';

/**
 * Menu « champ personnalisé » réutilisable sur n'importe quelle tâche.
 *
 * Trois gestes, un seul panneau :
 *  - saisir une valeur pour un champ déjà rattaché au type de la tâche ;
 *  - piocher un champ existant du projet qui n'est pas encore rattaché à ce
 *    type — il l'est alors automatiquement (`useCustomField`) ;
 *  - créer un champ de toutes pièces, rattaché lui aussi automatiquement.
 *
 * Le composant ne suppose rien de son hôte : il reçoit la tâche, se charge de
 * l'API et signale ce qui a changé. À l'hôte de rafraîchir sa liste.
 */
@Component({
  standalone: true,
  selector: 'app-custom-field-menu',
  imports: [CommonModule, FormsModule, MatMenuModule, CustomFieldComponent],
  templateUrl: './custom-field-menu.component.html',
  styleUrl: './custom-field-menu.component.css'
})
export class CustomFieldMenuComponent implements OnInit {

  /** Tâche courante : porte l'identifiant de la valeur et le type à équiper. */
  @Input() issue: Issue | any;

  /** Le déclencheur est une icône seule par défaut (barres latérales déjà
   *  chargées) ; un hôte au large peut demander le libellé. */
  @Input() showLabel = false;
  @Input() label = 'Ajouter un champ';

  /** Émis quand un champ vient d'être rattaché au type de la tâche : l'hôte
   *  doit recharger sa liste, le champ concerne désormais toutes les tâches de
   *  ce type. */
  @Output() fieldAttached = new EventEmitter<CustomField>();

  /** Émis après l'enregistrement d'une valeur. */
  @Output() valueSaved = new EventEmitter<CustomFieldValue[]>();

  // La fabrique de `display-customfiel-factory` lève une exception sur un type
  // inconnu. On ne propose donc la saisie que pour ce qu'elle sait rendre ; un
  // champ d'un autre type est rattaché, mais sans écran de saisie. `Issue` en
  // est exclu : son composant n'est encore qu'une ébauche.
  private static readonly RENDERABLE = ['String', 'Date', 'Number', 'User', 'Selection', 'CheckBox'];

  /** Types proposés à la création — mêmes libellés que l'écran de config. */
  readonly typeChoices = [
    {type: 'String', label: 'Texte'},
    {type: 'Number', label: 'Nombre'},
    {type: 'Date', label: 'Date'},
    {type: 'User', label: 'Utilisateur'},
    {type: 'Selection', label: 'Liste déroulante'},
    {type: 'CheckBox', label: 'Choix multiple'},
  ];

  @ViewChild(MatMenuTrigger) private trigger?: MatMenuTrigger;

  step: MenuStep = 'list';
  search = '';
  saving = false;
  error = '';

  /** Champs déjà rattachés au type de la tâche. */
  assignedFields: CustomField[] = [];
  /** Tous les champs du projet (flux déjà alimenté par le service). */
  private projectFields: CustomField[] = [];

  /** Brouillon de création. */
  draftName = '';
  draftType = 'String';
  draftOptions = '';

  /** Valeur en cours de saisie, une fois le champ choisi. */
  pendingValue: CustomFieldValue | any = null;

  constructor(
    private issueService: IssueService,
    protected projectGuard: ProjectGuard
  ) {
  }

  ngOnInit(): void {
    this.issueService.allCustomField$.subscribe(fields => {
      this.projectFields = fields ?? [];
    });
  }

  // -----------------------------------------------------------------------
  // Ouverture / navigation
  // -----------------------------------------------------------------------

  onMenuOpened(): void {
    this.step = 'list';
    this.search = '';
    this.error = '';
    this.pendingValue = null;
    this.resetDraft();
    this.loadAssignedFields();
  }

  backToList(): void {
    this.step = 'list';
    this.error = '';
    this.pendingValue = null;
  }

  startCreate(): void {
    this.resetDraft();
    this.error = '';
    this.step = 'create';
  }

  private loadAssignedFields(): void {
    const issueTypeId = this.issueTypeId;
    if (!issueTypeId) {
      this.assignedFields = [];
      return;
    }
    this.issueService.customFieldsByIssueType(issueTypeId).subscribe({
      next: using => this.assignedFields = (using ?? []).map(u => u.customField).filter(Boolean),
      error: () => this.error = "Impossible de charger les champs du type."
    });
  }

  private get issueTypeId(): number | undefined {
    return this.issue?.issueType?.id;
  }

  // -----------------------------------------------------------------------
  // Listes
  // -----------------------------------------------------------------------

  get assignedMatches(): CustomField[] {
    return this.filter(this.assignedFields);
  }

  /** Champs du projet qui existent mais ne sont pas encore sur ce type. */
  get availableMatches(): CustomField[] {
    const assigned = new Set(this.assignedFields.map(f => f.id));
    return this.filter(this.projectFields.filter(f => !assigned.has(f.id)));
  }

  private filter(fields: CustomField[]): CustomField[] {
    const needle = this.search.trim().toLowerCase();
    if (!needle) {
      return fields;
    }
    return fields.filter(f => (f.name ?? '').toLowerCase().includes(needle));
  }

  get hasResults(): boolean {
    return this.assignedMatches.length > 0 || this.availableMatches.length > 0;
  }

  icon(field: CustomField): string {
    return CustomFieldComponent.getIcone(field)?.value ?? 'fa fa-tag';
  }

  trackByFieldId(index: number, field: CustomField): number {
    return field.id;
  }

  // -----------------------------------------------------------------------
  // Choix d'un champ
  // -----------------------------------------------------------------------

  /** Champ déjà sur le type : rien à rattacher, on passe à la saisie. */
  pickAssigned(field: CustomField): void {
    this.openValueStep(field);
  }

  /** Champ du projet non rattaché : on l'attache d'abord au type courant. */
  pickAvailable(field: CustomField): void {
    this.attachToIssueType(field, () => this.openValueStep(field));
  }

  private attachToIssueType(field: CustomField, done: () => void): void {
    const issueTypeId = this.issueTypeId;
    if (!issueTypeId) {
      this.error = "Cette tâche n'a pas de type : impossible d'y rattacher un champ.";
      return;
    }
    this.saving = true;
    // `useCustomField` est idempotent côté serveur : le rattacher deux fois ne
    // crée pas de doublon.
    this.issueService.useCustomField({customField: {id: field.id}, issueType: {id: issueTypeId}} as any)
      .subscribe({
        next: () => {
          this.saving = false;
          if (!this.assignedFields.some(f => f.id === field.id)) {
            this.assignedFields = [...this.assignedFields, field];
          }
          // Le flux projet porte le rattachement : sans rechargement, l'écran
          // de configuration afficherait encore l'ancien état.
          this.issueService.loadAllCustomField();
          this.fieldAttached.emit(field);
          done();
        },
        error: () => {
          this.saving = false;
          this.error = "Le rattachement du champ a échoué.";
        }
      });
  }

  // -----------------------------------------------------------------------
  // Création d'un champ
  // -----------------------------------------------------------------------

  get needsOptions(): boolean {
    return this.draftType === 'Selection' || this.draftType === 'CheckBox';
  }

  get canCreate(): boolean {
    if (!this.draftName.trim() || this.saving) {
      return false;
    }
    return !this.needsOptions || this.parsedOptions.length > 0;
  }

  /** Une option par ligne, la virgule est acceptée comme séparateur. */
  private get parsedOptions(): string[] {
    return this.draftOptions
      .split(/[\n,]/)
      .map(option => option.trim())
      .filter(option => option.length > 0);
  }

  createField(): void {
    if (!this.canCreate) {
      return;
    }
    this.saving = true;
    this.error = '';
    // Le projet est renseigné par le service à partir du projet courant.
    const draft: any = {
      name: this.draftName.trim(),
      type: this.draftType,
      options: this.needsOptions ? this.parsedOptions : []
    };
    this.issueService.saveCustomField(draft).subscribe({
      next: created => {
        this.saving = false;
        if (!created?.id) {
          this.error = "Le champ n'a pas pu être créé.";
          return;
        }
        // Créer sans rattacher laisserait un champ orphelin, invisible depuis
        // la tâche d'où on vient de le demander.
        this.attachToIssueType(created, () => this.openValueStep(created));
      },
      error: () => {
        this.saving = false;
        this.error = "Le champ n'a pas pu être créé.";
      }
    });
  }

  private resetDraft(): void {
    this.draftName = '';
    this.draftType = 'String';
    this.draftOptions = '';
  }

  // -----------------------------------------------------------------------
  // Saisie de la valeur
  // -----------------------------------------------------------------------

  private openValueStep(field: CustomField): void {
    if (!CustomFieldMenuComponent.RENDERABLE.includes(field.type as string)) {
      // Type sans écran de saisie : le champ est rattaché, on s'arrête là.
      this.close();
      return;
    }
    this.pendingValue = CustomFieldComponent.newValue(this.issue, field);
    this.step = 'value';
  }

  /** L'utilisateur vient de désigner le champ : ouvrir en lecture puis exiger
   *  un clic sur le crayon n'aurait aucun sens, on ouvre en saisie. */
  @ViewChild('editor') set editor(component: CustomFieldComponent | undefined) {
    if (!component) {
      return;
    }
    // Hors du cycle de détection en cours : basculer l'enfant en édition
    // pendant qu'Angular vient de le vérifier lèverait un
    // ExpressionChangedAfterItHasBeenChecked en mode développement.
    setTimeout(() => {
      try {
        component.toggleEdit();
      } catch {
        // Type que la fabrique ne sait pas instancier : on laisse le composant
        // dans son état, l'essentiel — le rattachement — est déjà fait.
      }
    });
  }

  onValueSaved(values: CustomFieldValue[]): void {
    this.valueSaved.emit(values);
    this.close();
  }

  close(): void {
    this.trigger?.closeMenu();
    this.step = 'list';
    this.pendingValue = null;
  }
}
