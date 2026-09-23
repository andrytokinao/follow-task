import {
  Component,
  EventEmitter,
  Input,
  Output, ViewChild
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatInput, MatInputModule } from '@angular/material/input';
import {MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import { TextFieldModule } from '@angular/cdk/text-field';
import { NgxColorsModule } from 'ngx-colors';
import { IssueType, Project, Icone } from '../../type/issue';
import { IssueService } from '../../services/issue.service';
import { ChooseDialogComponent } from '../icone-field/choose-dialog/choose-dialog.component';
import {IconeViewComponent} from "../icone-view/icone-view.component";
import {forkJoin, Observable, of, Subject} from "rxjs";
import {catchError, debounceTime, distinctUntilChanged, switchMap} from "rxjs/operators";
import {cleanPrefixForSave, normalizePrefix, PREFIX_MAX_LENGTH} from "../../type/issue-type-prefix.util";

@Component({
  selector: 'app-issutype-form2',
  standalone: true,
  imports: [
    MatFormField,
    MatIcon,
    MatButton,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatInput,
    TextFieldModule,
    NgxColorsModule,
    CommonModule,
    ChooseDialogComponent,
    IconeViewComponent
  ],
  templateUrl: './issutype-form2.component.html',
  styleUrl: './issutype-form2.component.css'
})
export class IssutypeForm2Component {

  form: FormGroup;
  @ViewChild(MatMenuTrigger) iconMenuTrigger!: MatMenuTrigger;

  @Output() oneSaved = new EventEmitter<IssueType>();
  @Output() cancelled = new EventEmitter<void>();

  @Input() level: 'PARENT' | 'SUB_TASK' = 'PARENT';
  /** Types principaux auxquels le sous-type est rattache (plusieurs possibles). */
  @Input() set parents(value: IssueType[] | null | undefined) {
    this.selectedParents = [...(value || [])];
    this.applyParentDefaults();
  }
  /** Types principaux proposes ; a defaut, ceux du projet courant. */
  @Input() set availableParents(value: IssueType[] | null | undefined) {
    this.explicitParents = value || null;
  }
  selectedParents: IssueType[] = [];
  private explicitParents: IssueType[] | null = null;
  private projectParents: IssueType[] = [];
  /** true quand le formulaire est integre a un panneau et non a un menu flottant */
  @Input() embedded: boolean = false;

  /** type en cours de modification ; null pour une creation */
  private edited: IssueType | null = null;
  selectedIcone: Icone | undefined;
  project: Project;
  saving = false;
  errorMessage: string | undefined;

  /** Creation d'un sous-type : en creer un nouveau ou reutiliser un existant. */
  subMode: 'new' | 'existing' = 'new';
  parentSearch = '';
  existingSearch = '';
  selectedExisting: IssueType[] = [];
  /** Le prefixe est propose a partir du nom tant que l'utilisateur ne l'a pas saisi. */
  private prefixEdited = false;
  private colorEdited = false;

  /**
   * Disponibilite du prefixe saisi, telle que le serveur la voit.
   * null tant qu'aucune reponse n'est connue pour la valeur courante.
   *
   * <p>Verifie pendant la frappe et non a la sortie du champ : le prefixe est
   * propose a partir du nom, l'utilisateur n'y passe donc souvent jamais.</p>
   */
  prefixAvailable: boolean | null = null;
  prefixChecking = false;
  private prefixRequests = new Subject<string>();
  /**
   * Prefixe deja enregistre du type modifie. Il reste acceptable meme s'il est
   * en double : les espaces de travail crees avant la regle d'unicite peuvent
   * en contenir, et on ne rend pas ces types intouchables. Meme tolerance que
   * le serveur.
   */
  private originalPrefix = '';

  colorPalette = [
    '#6C63FF', '#4f46e5', '#7c3aed',
    '#db2777', '#dc2626', '#ea7c0e',
    '#16a34a', '#0284c7', '#0891b2',
    '#374151', '#6b7280', '#9ca3af',
  ];

  constructor(
    private fb: FormBuilder,
    private issueService: IssueService
  ) {
    this.form = this.fb.group({
      name:        ['', Validators.required],
      prefix:      ['', [Validators.required, Validators.maxLength(PREFIX_MAX_LENGTH)]],
      description: [''],
      color:       ['#6C63FF'],
    });

    this.issueService.project$.subscribe(p => this.project = p);
    this.issueService.issueType$.subscribe(types => this.projectParents = types || []);

    this.form.get('name')!.valueChanges.subscribe(name => {
      if (!this.isEdit && !this.prefixEdited) {
        this.setPrefix(this.suggestPrefix(name));
      }
    });
    this.form.get('prefix')!.valueChanges.subscribe(value => {
      this.prefixEdited = true;
      // La saisie n'est pas reecrite ici : la normaliser a chaque frappe
      // renverrait le curseur en fin de champ. Seule la verification suit.
      this.prefixRequests.next(normalizePrefix(value));
    });
    this.form.get('color')!.valueChanges.subscribe(() => this.colorEdited = true);
    this.watchPrefixAvailability();
  }

  /**
   * Normalise le prefixe a la sortie du champ : les espaces qui separent deux
   * mots deviennent un tiret bas, ceux de tete et de fin disparaissent.
   *
   * <p>A la sortie du champ et non pendant la frappe : l'utilisateur garde la
   * main sur son curseur, et voit le resultat une fois sa saisie terminee.</p>
   */
  onPrefixBlur(): void {
    this.setPrefix(this.form.get('prefix')!.value);
  }

  /**
   * Ecrit le prefixe normalise et demande sa disponibilite.
   *
   * <p>L'ecriture est silencieuse ({@code emitEvent: false}) pour ne pas
   * reboucler sur l'abonnement a {@code valueChanges} ; la verification est
   * donc declenchee ici, y compris pour un prefixe propose a partir du nom.</p>
   */
  private setPrefix(value: string | null | undefined): void {
    const normalized = normalizePrefix(value);
    const control = this.form.get('prefix')!;
    if (control.value !== normalized) {
      control.setValue(normalized, {emitEvent: false});
    }
    this.prefixRequests.next(normalized);
  }

  /**
   * Demande au serveur si le prefixe est libre, pendant la frappe.
   * Le prefixe etant propose a partir du nom, un controle a la sortie du champ
   * ne se declencherait pas dans le parcours courant.
   */
  private watchPrefixAvailability(): void {
    this.prefixRequests
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((prefix): Observable<boolean | null> => {
          const projectId = this.currentProjectId;
          // Champ vide, ou prefixe deja porte par le type modifie : rien a dire.
          if (!prefix || projectId == null || prefix === this.originalPrefix) {
            this.prefixChecking = false;
            return of(null);
          }
          this.prefixChecking = true;
          // switchMap : une reponse tardive ne doit pas ecraser une saisie plus recente.
          return this.issueService
            .isPrefixAvailable(projectId, prefix, this.edited?.id ?? null)
            .pipe(catchError(() => of(true)));
        })
      )
      .subscribe(available => {
        this.prefixChecking = false;
        this.prefixAvailable = available;
      });
  }

  /** Espace de travail dans lequel le prefixe doit etre unique. */
  private get currentProjectId(): number | null {
    const id = this.edited?.project?.id ?? this.project?.id;
    return id == null ? null : Number(id);
  }

  /** Types du projet : racines et sous-types, sans doublon. */
  private get knownTypes(): IssueType[] {
    const byId = new Map<any, IssueType>();
    (this.explicitParents || this.projectParents).forEach(root => {
      byId.set(root.id, root);
      (root.children || []).forEach(child => {
        if (!byId.has(child.id)) {
          byId.set(child.id, child);
        }
      });
    });
    return [...byId.values()];
  }

  get parentOptions(): IssueType[] {
    return (this.explicitParents || this.projectParents)
      .filter(type => type.level !== 'SUB_TASK' && type.id != this.edited?.id);
  }

  get filteredParentOptions(): IssueType[] {
    const term = this.parentSearch.toLowerCase().trim();
    return this.parentOptions.filter(p => !term || this.matches(p, term));
  }

  isParentSelected(parent: IssueType): boolean {
    return this.selectedParents.some(p => p.id == parent.id);
  }

  toggleParent(parent: IssueType): void {
    this.selectedParents = this.isParentSelected(parent)
      ? this.selectedParents.filter(p => p.id != parent.id)
      : [...this.selectedParents, parent];
    this.applyParentDefaults();
  }

  // ---- reutilisation d'un sous-type existant ----

  /** Sous-types existants qui ne sont pas encore rattaches a tous les parents choisis. */
  get existingSubTypes(): IssueType[] {
    const term = this.existingSearch.toLowerCase().trim();
    return this.knownTypes
      .filter(type => type.level === 'SUB_TASK')
      .filter(type => !this.selectedParents.length || this.missingParents(type).length > 0)
      .filter(type => !term || this.matches(type, term));
  }

  private missingParents(type: IssueType): IssueType[] {
    return this.selectedParents.filter(p => !(type.parents || []).some(tp => tp.id == p.id));
  }

  parentNamesOf(type: IssueType): string {
    const names = (type.parents || []).map(p => p.name);
    return names.length ? names.join(', ') : 'non rattaché';
  }

  isExistingSelected(type: IssueType): boolean {
    return this.selectedExisting.some(t => t.id == type.id);
  }

  toggleExisting(type: IssueType): void {
    this.selectedExisting = this.isExistingSelected(type)
      ? this.selectedExisting.filter(t => t.id != type.id)
      : [...this.selectedExisting, type];
  }

  /** Rattache les sous-types existants choisis a chacun des parents selectionnes. */
  attachExisting(): void {
    if (!this.selectedParents.length) {
      this.errorMessage = 'Choisissez au moins un type parent.';
      return;
    }
    const links = this.selectedExisting.flatMap(type =>
      this.missingParents(type).map(parent => this.issueService.affectIssueTypeForParent(type.id, parent.id)));
    if (!links.length || this.saving) {
      return;
    }
    this.saving = true;
    this.errorMessage = undefined;
    forkJoin(links).subscribe({
      next: (saved) => {
        this.saving = false;
        this.selectedExisting = [];
        this.oneSaved.emit(saved[saved.length - 1]);
      },
      error: (error) => {
        this.errorMessage = this.extractMessage(error);
        this.saving = false;
      }
    });
  }

  // ---- valeurs proposees ----

  /** RELEVE TOPO -> RT ; un seul mot -> 4 premieres lettres. */
  private suggestPrefix(name: string): string {
    const words = ('' + (name || ''))
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toUpperCase().split(/[^A-Z0-9]+/).filter(w => w);
    if (!words.length) {
      return '';
    }
    return words.length === 1 ? words[0].substring(0, 4) : words.map(w => w[0]).join('').substring(0, 5);
  }

  /** En creation d'un sous-type, reprend la couleur du premier parent. */
  private applyParentDefaults(): void {
    if (this.isEdit || this.colorEdited || !this.selectedParents.length) {
      return;
    }
    const color = this.selectedParents[0].color;
    if (color) {
      this.form.get('color')!.setValue(color, {emitEvent: false});
    }
  }

  /** Prefixe saisi et refuse par le serveur : le formulaire ne peut pas etre valide. */
  get prefixTaken(): boolean {
    return this.prefixAvailable === false;
  }

  /** Longueur maximale du champ, reprise par le template. */
  readonly prefixMaxLength = PREFIX_MAX_LENGTH;

  private matches(type: IssueType, term: string): boolean {
    return ('' + (type.name || '')).toLowerCase().includes(term)
      || ('' + (type.prefix || '')).toLowerCase().includes(term);
  }

  get allParentsSelected(): boolean {
    const options = this.parentOptions;
    return options.length > 0 && options.every(p => this.isParentSelected(p));
  }

  /** Rattache le sous-type a tous les types principaux (ou a aucun). */
  toggleAllParents(): void {
    this.selectedParents = this.allParentsSelected ? [] : [...this.parentOptions];
    this.applyParentDefaults();
  }

  /**
   * Alimente le formulaire pour une modification ; null repasse en creation.
   */
  @Input() set issueType(value: IssueType | null | undefined) {
    this.edited = value || null;
    if (!this.edited) {
      this.onReset();
      return;
    }
    this.errorMessage = undefined;
    // Le prefixe deja enregistre est valide : pas de verification a l'ouverture.
    this.prefixAvailable = null;
    this.prefixChecking = false;
    this.originalPrefix = normalizePrefix(this.edited.prefix as string);
    this.form.reset({
      name: this.edited.name || '',
      prefix: this.edited.prefix || '',
      description: this.edited.description || '',
      color: this.edited.color || '#6C63FF'
    });
    this.subMode = 'new';
    this.selectedIcone = this.edited.icone;
    this.level = (this.edited.level as 'PARENT' | 'SUB_TASK') || 'PARENT';
    this.selectedParents = [...(this.edited.parents || [])];
  }

  get isEdit(): boolean {
    return this.edited != null && this.edited.id != null;
  }

  setLevel(level: 'PARENT' | 'SUB_TASK'): void {
    this.level = level;
    this.onReset();
  }

  setParent(parent: IssueType | null | undefined): void {
    this.setParents(parent ? [parent] : []);
  }

  setParents(parents: IssueType[] | null | undefined): void {
    this.selectedParents = [...(parents || [])];
    if (this.selectedParents.length) {
      this.setLevel('SUB_TASK');
    }
    this.applyParentDefaults();
  }

  onIconSelected(icone: Icone | any): void {
    this.selectedIcone = icone;
    this.iconMenuTrigger?.closeMenu();
  }

  onReset(): void {
    this.form.reset({ color: '#6C63FF', name: '', prefix: '', description: '' });
    this.prefixEdited = false;
    this.colorEdited = false;
    this.prefixAvailable = null;
    this.prefixChecking = false;
    this.originalPrefix = this.edited ? normalizePrefix(this.edited.prefix as string) : '';
    this.selectedExisting = [];
    this.existingSearch = '';
    this.selectedIcone = this.edited ? this.edited.icone : undefined;
    this.errorMessage = undefined;
    this.applyParentDefaults();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (this.form.invalid || !this.level || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.prefixTaken) {
      this.errorMessage = 'Ce préfixe est déjà utilisé dans cet espace de travail.';
      return;
    }

    this.errorMessage = undefined;
    this.saving = true;

    const projectId = this.edited?.project?.id || this.project?.id;
    const issueType: IssueType = {
      level:       this.level,
      name:        ('' + (this.form.value.name || '')).trim(),
      // Espaces de tete et de fin retires a l'enregistrement.
      prefix:      cleanPrefixForSave(this.form.value.prefix),
      description: this.form.value.description,
      color:       this.form.value.color,
      icone:       this.selectedIcone,
      project:     { id: projectId },
    };

    if (this.isEdit) {
      // en modification, les relations non editees sont renvoyees telles quelles
      // pour ne pas etre ecrasees cote serveur.
      issueType.id = this.edited.id;
      issueType.style = this.edited.style;
      if (this.edited.curentWorkFlow) {
        issueType.curentWorkFlow = {id: this.edited.curentWorkFlow.id};
      }
    }

    if (this.level === 'SUB_TASK') {
      if (!this.selectedParents.length) {
        this.errorMessage = 'Choisissez au moins un type parent.';
        this.saving = false;
        return;
      }
      issueType.parents = this.selectedParents.map(p => ({ id: p.id }));
    } else if (this.isEdit && this.edited.level === 'SUB_TASK') {
      // repasse en type principal : plus aucun parent
      issueType.parents = [];
    }

    this.issueService.saveIssueType(issueType).subscribe({
      next: (saved) => {
        this.saving = false;
        this.oneSaved.emit(saved);
        if (!this.isEdit) {
          this.onReset();
        }
      },
      error: (error) => {
        this.errorMessage = this.extractMessage(error);
        this.saving = false;
      }
    });
  }

  private extractMessage(error: any): string {
    const graphQlMessage = error?.graphQLErrors?.length ? error.graphQLErrors[0].message : null;
    return graphQlMessage || error?.message || "Erreur lors de l'enregistrement.";
  }
}
