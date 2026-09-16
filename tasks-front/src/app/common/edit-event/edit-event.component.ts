import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { EventApp, Issue, EventTypeApp, User, Project, PercentageProposal } from '../../type/issue';
import { EventsService } from '../../services/events.service';
import { IssueService } from '../../services/issue.service';
import { AuthService } from '../../services/auth.service';

export function endAfterStartValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('start')?.value;
    const end   = group.get('end')?.value;
    if (start && end && new Date(end) <= new Date(start)) {
      return { endBeforeStart: true };
    }
    return null;
  };
}

@Component({
  standalone: false,
  selector: 'app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrl: './edit-event.component.css'
})
export class EditEventComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() event!: EventApp;
  @Input() byIssue = false;
  @Output() saved    = new EventEmitter<EventApp>();
  @Output() onClose  = new EventEmitter<boolean>();
  @Input() isNext: boolean = false;
  /**
   * Suivre l'événement « sélectionné » diffusé par EventsService. Utile quand
   * le formulaire est piloté à distance ; à couper quand l'hôte appelle
   * loadEvent lui-même, sinon chaque sélection faite ailleurs rechargerait ce
   * formulaire — et un BehaviorSubject rejoue la dernière dès l'initialisation.
   */
  @Input() suivreSelection: boolean = true;

  /** Jeton de la dernière demande : une réponse tardive ne doit pas écraser la suivante. */
  private demande = 0;

  percentageProposal: PercentageProposal | undefined;
  completionPercentage: number = 0;
  _description:string ='';

  project: Project;
  editEventForm!: FormGroup;
  submitted    = false;
  loading      = false;
  loadingEvent = false;
  user: User;

  get description(): string {
    return this._description || '';

  }
  set description(value: string) {
    if (this.event) this.event.description = value;
    this._description = value;
  }

  masters:      Issue[] = [];
  subtasksList: Issue[] = [];

  @Input() selectedMaster?:  Issue;
  @Input() selectedSubtask?: Issue;

  eventTypes:         EventTypeApp[] = [];
  selectedEventType?: EventTypeApp;

  private destroy$ = new Subject<void>();

  get f() { return this.editEventForm.controls; }
  get endBeforeStart(): boolean { return this.editEventForm.hasError('endBeforeStart'); }
  get descriptionLength(): number { return (this.event?.description || '').length; }

  /**
   * Le même formulaire sert à créer et à modifier : seule l'absence
   * d'identifiant les distingue. Le serveur crée ou met à jour selon ce même
   * critère, il n'y a donc rien d'autre à brancher.
   */
  get estCreation(): boolean { return !this.event?.id; }

  /**
   * L'avancement n'a de sens que pour une sous-tâche : c'est elle qui
   * s'exécute par sessions successives. Une demande agrège ses sous-tâches ;
   * lui saisir un pourcentage à la main contredirait ce calcul.
   */
  get avancementApplicable(): boolean { return !!this.selectedSubtask; }

  /** Utilisateur imposé par l'appelant — la ressource cliquée dans le planning. */
  private utilisateurImpose?: User;
  private utilisateurConnecte?: User;

  /** Titre suggéré dynamiquement selon la tâche et le moment de la journée */
  get titlePlaceholder(): string {
    const issue = this.selectedSubtask ?? this.selectedMaster;
    if (!issue) return 'Ex. Travail sur PROJ-42 — lundi matin';
    const part = this._dayPart();
    const day  = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
    return `Travail sur ${issue.issueKey} — ${day} ${part}`;
  }

  constructor(
    public  activeModal:  NgbActiveModal,
    private fb:           FormBuilder,
    private eventService: EventsService,
    private issueService: IssueService,
    private authService:  AuthService
  ) {}

  ngOnInit(): void {
    this._buildForm();
    this._patchForm(this.event);
    this._watchMasters();
    this._loadEventTypes();
    this._loadConnectedUser();

    this.issueService.project$.pipe(takeUntil(this.destroy$)).subscribe(project => {
      this.project = project;
    });

    this.eventService.selectedEventData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (this.suivreSelection && data && data.id) this.loadEvent(data.id);
    });
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Form ──────────────────────────────────────────────────────────────────

  private _buildForm(): void {
    this.editEventForm = this.fb.group(
      {
        title:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
        start:       ['', Validators.required],
        end:         ['', Validators.required],
        description: ['', Validators.maxLength(500)],
      },
      { validators: endAfterStartValidator() }
    );
  }

  private _patchForm(event: EventApp | null | undefined): void {
    if (!event) return;
    this.editEventForm.patchValue({
      title:       event.title       || '',
      start:       this._toDatetimeLocal(event.start),
      end:         this._toDatetimeLocal(event.end),
      description: event.description || '',
    });
    if (event.completionPercentage != null) {
      this.completionPercentage = event.completionPercentage;
    }
  }

  // ─── Title suggestion ──────────────────────────────────────────────────────

  /**
   * Propose un titre basé sur la tâche sélectionnée.
   * N'écrase pas si l'utilisateur a déjà saisi quelque chose.
   */
  suggestTitle(): void {
    const currentTitle = this.editEventForm.get('title')?.value?.trim();
    if (currentTitle) return; // respecte la saisie manuelle
    const issue = this.selectedSubtask ?? this.selectedMaster;
    if (!issue) return;
    const part = this._dayPart();
    const day  = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
    const suggestion = `Travail sur ${issue.issueKey} — ${day} ${part}`;
    this.editEventForm.patchValue({ title: suggestion });
  }

  private _dayPart(): string {
    const h = new Date().getHours();
    if (h < 12) return 'matin';
    if (h < 17) return 'après-midi';
    return 'soir';
  }

  // ─── Event loading ─────────────────────────────────────────────────────────

  loadEvent(id: number | string): void {
    const demande = ++this.demande;
    this.submitted = false;
    this.loadingEvent = true;
    this.eventService.getByEventById(id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingEvent = false))
      .subscribe({
        next: (event) => {
          // Le même formulaire peut avoir été rouvert entre-temps (autre
          // événement, ou création) : on ignore la réponse devenue obsolète.
          if (demande !== this.demande) return;
          this.event = event;
          // Modifier l'événement d'un collègue ne doit pas se l'approprier :
          // onSubmit renvoie this.user, qui valait jusqu'ici l'utilisateur
          // connecté quel que soit le propriétaire.
          this.utilisateurImpose = event.user?.id ? event.user : undefined;
          this.user = this.utilisateurImpose ?? this.utilisateurConnecte;
          this.setDescription(event);
          this._patchForm(event);
          this._resolveIssueSelection(event);
          this._resolveEventType(event);
        },
        error: (err) => { console.error(err); }
      });
  }

  /**
   * Ouvre le formulaire en création, pré-rempli par l'appelant : la plage
   * sélectionnée dans DayPilot, la tâche en cours, la ressource cliquée.
   *
   * Ce formulaire remplace NewEventComponent pour la création, qui n'avait ni
   * dates éditables, ni suggestion de titre, ni avancement — et dont le menu
   * de sous-tâches n'était relié à aucun déclencheur.
   */
  prepareCreation(event: Partial<EventApp>): void {
    // Une même instance sert d'une ouverture à l'autre : on repart d'un état
    // vierge, sans les erreurs, la proposition ni la sélection précédentes.
    ++this.demande;
    this.submitted = false;
    this.loadingEvent = false;
    this.editEventForm.reset();
    this._effacerAvancement();
    this.utilisateurImpose = undefined;
    this.user = this.utilisateurConnecte;
    if (!this.byIssue) {
      this.selectedMaster = undefined;
      this.selectedSubtask = undefined;
      this.subtasksList = [];
    }
    this.event = {
      ...event,
      id: undefined,
      // DayPilot transmet des DayPilot.Date : on les ramène à leur forme texte
      // locale (« 2026-09-16T10:00:00 ») avant de remplir les champs date.
      start: this._versTexte(event.start),
      end: this._versTexte(event.end),
    } as EventApp;
    if (event.user?.id) {
      this.utilisateurImpose = event.user;
      this.user = event.user;
    }
    this.setDescription(this.event);
    this._patchForm(this.event);
    this._resolveIssueSelection(this.event);
    this._resolveEventType(this.event);
    this.suggestTitle();
    if (this.selectedSubtask?.id != null) {
      this.loadPropositionPercentage(this.selectedSubtask.id as number);
    }
  }

  loadNextEvent(issue: Issue): void {
    this.loadingEvent = true;
    takeUntil(this.destroy$);
    this.eventService.loadNextEvent()
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingEvent = false))
      .subscribe({
        next: (event) => {
          this.event = event;
          this.event.issue = { id: issue.id, summary: issue.summary, issueType: issue.issueType };
          this.setDescription(event);
          this._patchForm(event);
          this._resolveIssueSelection(event);
          this._resolveEventType(event);
        },
        error: (err) => { console.error(err); }
      });
    this.loadPropositionPercentage(issue.id as number);
  }

  private _resolveEventType(event: EventApp): void {
    if (!this.eventTypes.length) {
      return;
    }
    // En création il n'y a pas encore de type, et ce formulaire n'offre pas de
    // sélecteur : sans valeur par défaut, onSubmit refusait en silence.
    this.selectedEventType = event?.eventType
      ? this.eventTypes.find(t => t.id === event.eventType!.id) ?? this.eventTypes[0]
      : this.selectedEventType ?? this.eventTypes[0];
  }

  // ─── Issue selection ───────────────────────────────────────────────────────

  private _watchMasters(): void {
    this.issueService.issueMasterList$
      .pipe(takeUntil(this.destroy$))
      .subscribe(masters => { this.masters = masters; });
  }

  private _resolveIssueSelection(event: EventApp): void {
    if (!event.issue) {
      // En mode « par tâche », la sélection vient des @Input : l'effacer ici
      // vidait les sélecteurs masqués sans que rien ne puisse les remplir.
      if (!this.byIssue) {
        this.selectedMaster  = undefined;
        this.selectedSubtask = undefined;
      }
      return;
    }
    if (event.issue.parent != null) {
      this.selectedMaster  = event.issue.parent;
      this.selectedSubtask = event.issue;
      this._loadSubtasks(event.issue.parent.id);
      return;
    }
    if (this._estSousTache(event.issue)) {
      // Issue transmise sans son parent — loadNextEvent ne garde que id, titre
      // et type. La classer comme demande effaçait la sous-tâche, et avec elle
      // l'avancement.
      this.selectedSubtask = { ...this.selectedSubtask, ...event.issue };
      return;
    }
    this.selectedMaster  = event.issue;
    this.selectedSubtask = undefined;
    this._loadSubtasks(event.issue.id);
  }

  /** Sans parent chargé, on se fie à la sélection déjà connue puis au type. */
  private _estSousTache(issue: Issue): boolean {
    if (this.selectedSubtask?.id != null && this.selectedSubtask.id === issue.id) {
      return true;
    }
    const niveau = issue.issueType?.level;
    return niveau != null && niveau !== 'PARENT';
  }

  selectMaster(issue: Issue): void {
    this.selectedMaster  = issue;
    this.selectedSubtask = undefined;
    this.subtasksList    = [];
    this._loadSubtasks(issue.id);
    this.suggestTitle();
    // Pas de proposition pour une demande : l'avancement ne concerne que les
    // sous-tâches, et une valeur calculée ici resterait affichée à tort.
    this._effacerAvancement();
  }

  /** Choisir une sous-tâche recalcule la proposition pour cette sous-tâche. */
  selectSubtask(issue: Issue): void {
    this.selectedSubtask = issue;
    this.suggestTitle();
    this.loadPropositionPercentage(issue.id as number);
  }

  private _effacerAvancement(): void {
    this.percentageProposal   = undefined;
    this.completionPercentage = 0;
  }

  private _loadSubtasks(masterId: number): void {
    this.issueService.loadSubtask(masterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (issues) => { this.subtasksList = issues; },
        error: (err)    => { console.error(err); }
      });
  }

  // ─── Event types ───────────────────────────────────────────────────────────

  private _loadEventTypes(): void {
    this.eventService.eventTypes$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.eventTypes = types;
          // Les types peuvent arriver après prepareCreation : on résout ici
          // aussi, sinon la valeur par défaut ne serait jamais posée.
          this._resolveEventType(this.event);
        },
        error: (err) => { console.error(err); }
      });
  }

  selectEventType(type: EventTypeApp): void {
    this.selectedEventType = type;
  }

  // ─── Completion percentage ─────────────────────────────────────────────────

  loadPropositionPercentage(issueId: number): void {
    if (!issueId) return;
    this.percentageProposal  = undefined;
    this.completionPercentage = 0;
    this.eventService.proposeNextPercentage(issueId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (proposal) => {
          this.percentageProposal  = proposal;
         this.completionPercentage = proposal.proposed;
        },
        error: (err) => { console.error('Proposition percentage error:', err); }
      });
  }

  applyCandidate(value: number): void {
    this.completionPercentage = value;
  }

  onSliderChange(event: Event): void {
    this.completionPercentage = +(event.target as HTMLInputElement).value;
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.submitted = true;

    if (this.editEventForm.invalid || !this.selectedEventType) {
      this.editEventForm.markAllAsTouched();
      return;
    }

    const formValue = this.editEventForm.value;

    this.event = {
      ...this.event,
      title:                formValue.title.trim(),
      start:                formValue.start,
      end:                  formValue.end,
      allDay:               false,
      user:                 this.user,
      description:          this._description,
      eventType:            { id: this.selectedEventType.id, name: this.selectedEventType.name },
      project:              this.project ? { id: this.project.id } : this.event?.project,
      // Rien n'est enregistré sans sous-tâche : un 0 serait lu comme « aucun
      // avancement », alors que la question ne se pose simplement pas.
      completionPercentage: this.avancementApplicable ? this.completionPercentage : undefined,
    };

    if (this.selectedSubtask) {
      this.event.issue = { id: this.selectedSubtask.id } as Issue;
    } else if (this.selectedMaster) {
      this.event.issue = { id: this.selectedMaster.id } as Issue;
    }

    this.loading = true;
    this.eventService.saveEvent(this.event)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loading = false))
      .subscribe({
        next: (savedEvent) => {
          this.saved.emit(savedEvent ?? this.event);
          this.activeModal.close(savedEvent ?? this.event);
        },
        error: (err) => { console.error(err); }
      });
  }

  // ─── UI helpers ────────────────────────────────────────────────────────────

  dismiss(reason: 'close' | 'cancel' = 'cancel'): void {
    this.onClose.emit(true);
    this.activeModal.dismiss(reason);
  }

  private _versTexte(value: unknown): any {
    if (value == null || typeof value === 'string' || value instanceof Date) {
      return value;
    }
    return String(value);
  }

  private _toDatetimeLocal(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private _loadConnectedUser(): void {
    this.authService.connectedUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.utilisateurConnecte = user;
        // Dans la vue ressources, l'événement appartient à la personne dont on
        // a cliqué la colonne, pas à celle qui le saisit.
        this.user = this.utilisateurImpose ?? user;
      });
  }

  private setDescription(event: EventApp): void {
    this.description = event?.description || '';
  }
}
