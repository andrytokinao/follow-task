import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Injector,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { ChoixTypeSousTache, Issue, IssueType, Phase, Project, Status } from '../../type/issue';
import { IssueService } from '../../services/issue.service';
import { PhaseService } from '../../services/phase.service';
import {
  choixParDefaut,
  estHorsPhaseCourante,
  GroupeChoix,
  grouperChoix,
  legendeType,
  nombreDeChoixMasques
} from '../../type/choix-type-sous-tache.util';
import {MessagesService} from "../../services/messages.service";
import {MatMenuTrigger} from "@angular/material/menu";
import {ALL_EVENT_TYPE} from "../../type/graphql.operations";
import {IssutypeForm2Component} from "../issutype-form2/issutype-form2.component";
import {ProjectGuard} from "../../services/ProjectGuard";
import {catchError, map, Observable, of, shareReplay, switchMap} from "rxjs";
import {ToastrService} from "ngx-toastr";

@Component({
  standalone:false,
  selector: 'app-new-issue-form',
  templateUrl: './new-issue-form.component.html',
  styleUrls: ['./new-issue-form.component.scss']
})
export class NewIssueFormComponent implements OnInit, AfterViewInit{
  issueKey: String = '';
  summary: string = '';
  saving = false;
  description: string = '';
  issueType: IssueType | any = {};
  /**
   * Statut imposé à la création, quand le formulaire est ouvert depuis une
   * colonne de board. À null, le serveur applique le statut initial du flux de
   * travail du type choisi.
   */
  status: Status | null = null;
  project: Project | undefined;
  allIssueTypes: IssueType[] = [];
  useIssueType: IssueType[] = [];
  // ---- sous-tâche : types selon la phase du projet ----
  /** Entrées du menu : un type dans une phase. */
  choixSousTache: ChoixTypeSousTache[] = [];
  /** Phase en cours du projet ; null si son statut n'en désigne aucune. */
  phaseCourante: Phase | null = null;
  /** Phase dans laquelle la sous-tâche sera classée. */
  phaseChoisie: Phase | null = null;
  /** Les types des autres phases sont affichés (exceptions). */
  autresPhases = false;
  /** Groupes du menu des types, par phase. */
  groupesChoix: GroupeChoix[] = [];
  /** Entrées des autres phases, cachées tant qu'on ne les demande pas. */
  nombreChoixMasques = 0;
  projects:Project [] = [];
  /**
   * Demande parente d'une sous-tâche.
   *
   * Transmise par l'hôte, elle prime sur la demande courante diffusée par
   * `issueMaster$`. Sans cette priorité, un hôte qui crée une tâche dans un
   * projet choisi (le sélecteur du formulaire d'événement) voyait ce projet
   * remplacé par celui de la page, rejoué par le BehaviorSubject à
   * l'initialisation. Les écrans qui ne transmettent rien gardent le
   * comportement d'origine.
   */
  @Input()
  set parentIssue(parent: Issue | undefined) {
    this.parentFourni = parent?.id != null ? parent : undefined;
    this._parentIssue = parent;
    if (this.initialise && this.parentFourni && !this.isMaster) {
      this.loadIssueTypeSubtask();
    }
  }
  get parentIssue(): Issue | undefined {
    return this._parentIssue;
  }
  private _parentIssue: Issue | undefined;
  private parentFourni: Issue | undefined;
  private initialise = false;

  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  /**
   * L'issue vient d'être créée : l'hôte peut rafraîchir sa liste, la
   * sélectionner, la lier... Émis tout de suite, même si une question reste
   * posée — la création ne dépend pas de la réponse.
   */
  @Output() saved = new EventEmitter<Issue>();
  /**
   * Le parcours de création est terminé : l'hôte peut refermer le menu ou le
   * panneau, aussitôt après `saved`.
   */
  @Output() termine = new EventEmitter<void>();
  /** « Annuler » : l'hôte referme le menu qui porte le formulaire. */
  @Output() cancelled = new EventEmitter<void>();

  /** Tâche créée en attente de la réponse « vous l'assigner ? ». */
  tacheCreee?: Issue;
  step: string = '';
  @Input() isMaster = true;
  isDesable = false;
  private toClose: boolean;
  @ViewChild('autosize') autosize: CdkTextareaAutosize | undefined;
  private _injector = inject(Injector);
  protected errorMessage: string;
  @ViewChild('newIssueTypeTrigger') newIssueTypeTrigger!: MatMenuTrigger;
  @ViewChild('issutypeForm') issutypeForm!: IssutypeForm2Component;

  /**
   * Creer un type de demande releve de la configuration du projet : seuls le
   * gestionnaire de projet et l'administrateur y ont acces, les autres membres
   * se contentent de choisir parmi les types existants.
   *
   * `hasCredential` renvoie un Observable froid qui refait tout son travail a
   * chaque abonnement — d'ou le `shareReplay`, sans quoi le `| async` du gabarit
   * relancerait la resolution des droits a chaque cycle de detection. Les
   * porteurs de `CAN_ACCESS_ALL` (administrateur global) restent couverts.
   */
  protected readonly peutCreerType$: Observable<boolean>;

  /**
   * Case « M'assigner », cochée par défaut, pour un projet comme pour une
   * tâche. Elle remplace la question posée après la création
   * (app-question-assignation), désormais désactivée.
   * Aucun droit requis pour s'assigner (IssueAccessService.checkCanAssignSelf).
   */
  assignerMoi = true;

  constructor(public issueService: IssueService,
    private phaseService: PhaseService,
    protected messageService :MessagesService,
    private projectGuard: ProjectGuard,
    private toastr: ToastrService
  ) {
    this.peutCreerType$ = this.projectGuard
      .hasCredential(['PROJECT_MANAGER', 'ADMIN'])
      .pipe(shareReplay(1));
  }

  ngOnInit(): void {
    this.issueService.issueTypeParent$.subscribe(issueTypes => {
      this.issueTypesMasters = issueTypes;
      if (this.isMaster) {
        this.useIssueType = this.issueTypesMasters;
      }
      this.allIssueTypes = issueTypes;
    });

    this.issueService.issueType$.subscribe(types => {
      this.allIssueTypes = types;
    });

    this.issueService.project$.subscribe(project => {
      this.project = project;
    });
    this.issueService.issueTypeMasters$.subscribe(itm => {
      if (itm) {
        this.issueTypesMasters = itm;
        if (itm.length > 0) {
          this.issueType = itm[0];
          this.loadNextKey();
        }
      }
    });
    this.issueService.allProjects().subscribe(projects=> {
      this.projects = projects;
      if (this.project == null ){
        if( this.projects && this.projects.length>0)
       this.selectProject(undefined,undefined,this.projects[0]);
      }
    });
    this.issueService.issueMaster$.subscribe(issue => {
      // Un parent transmis par l'hôte prime sur la demande de la page.
      if (this.parentFourni) {
        return;
      }
      this._parentIssue = issue;
      if (this._parentIssue?.id) {
        if (!this.isMaster) {
          this.loadIssueTypeSubtask();
        }
      }
    })

    if (this.parentFourni && !this.isMaster) {
      this.loadIssueTypeSubtask();
    }
    this.initialise = true;
  }

  save(form: any) {
    this.errorMessage = undefined;
    if (form.invalid) return;
    this.saving = true;
    const issue: any = {
      summary: this.summary,
      description: this.description,
      issueKey: this.issueKey,
      issueType: this.issueType,
      project: { id: this.project?.id }
    };

    // Création depuis une colonne de board : la tâche naît dans ce statut. Le
    // serveur retombe sur le statut initial du flux si celui-ci ne lui convient pas.
    if (this.status?.id != null) {
      issue.status = { id: this.status.id };
    }

    if (this.parentIssue && !this.isMaster) {
      issue.parent = { id: this.parentIssue.id };
      // Phase de l'entrée choisie ; sans elle, le serveur prend la phase en cours.
      if (this.phaseChoisie?.id != null) {
        issue.phase = { id: this.phaseChoisie.id };
      }
    }

    // La case « M'assigner » est traitée avant `saved`, pour que la liste
    // rechargée par l'hôte le montre déjà assigné. Son échec ne défait pas la
    // création : on le signale seulement.
    this.issueService.saveIssue(issue).pipe(
      switchMap(cree => !this.assignerMoi || !cree?.id
        ? of(cree)
        : this.issueService.assignMe(cree).pipe(
          map(() => cree),
          catchError(() => {
            this.toastr.warning(`${cree.issueKey} créée, mais l'assignation a échoué`);
            return of(cree);
          })
        ))
    ).subscribe({
      next: (res) => {
        this.saving = false;
        this.saved.emit(res);
        this.summary = '';
        this.description = '';
        this.loadNextKey();
        // Plus de question « vous assigner ? » : la case l'a déjà traité.
        this.terminer();
      },
      error: (err:Error) => {
        console.log(err);
        this.saving = false;
        this.errorMessage = 'Error survenu lors de la creation '+JSON.stringify(err);
      }
    });
  }

  next() {
    this.step = 'next';
    this.save({});
  }

  complete() {
    this.step = 'complete';
    this.save({});
  }

  cancel() {
   this.tacheCreee = undefined;
   this.messageService.showRight('');
   this.cancelled.emit();
  }

  /**
   * Réponse à « vous assigner cette tâche ? » : le parcours est terminé.
   * `saved` n'est pas réémis — un hôte qui lie ou ajoute l'issue à ce signal
   * le ferait deux fois. Pour afficher l'assignation, rafraîchir sur `termine`.
   */
  onReponseAssignation(): void {
    this.terminer();
  }

  private terminer(): void {
    this.tacheCreee = undefined;
    this.messageService.showRight('');
    this.termine.emit();
  }


  loadNextKey() {
    this.issueService.getNextKeyParent(this.issueType.id,this.project.id).subscribe(key => {
      this.issueKey = key;
      this.isDesable = false;
    });
  }

  createMaster() {
    this.isDesable = true;
  }

  /**
   * Types proposés pour une sous-tâche : ceux de la phase en cours du projet
   * et les types sans phase ; les autres phases restent accessibles à la
   * demande (correction d'une phase passée, travail en avance).
   *
   * @param issueTypeId type à présélectionner (type tout juste créé) ; à
   *                    défaut, la première entrée proposée
   */
  loadIssueTypeSubtask(issueTypeId?: number) {
    this.isDesable = true;
    this.useIssueType = [];
    this.issueType = undefined;
    this.phaseChoisie = null;
    this.issueKey = '';

    this.phaseService.typesSousTache(this.parentIssue.id).subscribe(types => {
      this.choixSousTache = types?.choix || [];
      this.phaseCourante = types?.phaseCourante || null;
      this.autresPhases = false;
      this.nombreChoixMasques = nombreDeChoixMasques(this.choixSousTache);
      this.regrouperChoix();
      // Un type present dans plusieurs phases n'y figure qu'une fois.
      this.useIssueType = this.choixSousTache
        .map(choix => choix.issueType)
        .filter((type, i, types) => types.findIndex(t => t.id === type.id) === i);
      const defaut = choixParDefaut(this.choixSousTache, issueTypeId);
      if (defaut) {
        this.appliquerChoix(defaut);
      }
    });
  }

  /** La sous-tâche sera classée hors de la phase en cours : on le montre. */
  get horsPhaseCourante(): boolean {
    return estHorsPhaseCourante(this.phaseChoisie, this.phaseCourante);
  }

  basculerAutresPhases(event: Event) {
    event.stopPropagation();
    this.autresPhases = !this.autresPhases;
    this.regrouperChoix();
  }

  /**
   * Recalcule les groupes du menu. Un champ et non un getter : le menu
   * reconstruirait sinon ses entrées à chaque détection de changement.
   */
  private regrouperChoix() {
    this.groupesChoix = grouperChoix(this.choixSousTache, this.phaseCourante, this.autresPhases);
  }

  selectChoix(event: Event, trigger: MatMenuTrigger, choix: ChoixTypeSousTache) {
    if (event)
      event.stopPropagation();
    this.appliquerChoix(choix);
    if (trigger)
      trigger.closeMenu();
  }

  /** Légende sous le nom du type : sa phase, ou « Toutes phases ». */
  legende(choix: ChoixTypeSousTache): string {
    return legendeType(choix);
  }

  estChoisi(choix: ChoixTypeSousTache): boolean {
    return choix.issueType.id === this.issueType?.id && (choix.phase?.id ?? null) === (this.phaseChoisie?.id ?? null);
  }

  private appliquerChoix(choix: ChoixTypeSousTache) {
    this.issueType = choix.issueType;
    this.phaseChoisie = choix.phase || null;
    this.loadNextKey();
  }
  useIssueTypeMaster(defaultType:IssueType | undefined) {
    this.useIssueType = [];
    this.useIssueType = this.issueTypesMasters;
    this.issueType = undefined;
    this.issueKey = '';
    if (defaultType) {
      this.issueType = defaultType;
      this.loadNextKey();
      return;
    }
    if (this.useIssueType && this.useIssueType.length > 0) {
      this.issueType = this.useIssueType[0];
      this.loadNextKey();
      return;
    }
  }

  issueTypesMasters: IssueType[] = [];

  selectProject(event:Event,trigger: MatMenuTrigger,pr: Project) {
    if (event)
      event.stopPropagation();
    this.useIssueType = [];
    this.issueType = undefined;
    this.issueKey = '';
    this.issueService.listIssueTypeMaster(pr.id).subscribe( types => {
      this.useIssueType = types;
      this.project = pr;
      if (this.useIssueType.length) {
        this.issueType = this.useIssueType[0];
        this.loadNextKey();
      }
    });
    if (trigger)
      trigger.closeMenu();
  }

  canCreate(){
    if (!this.project || !this.issueType || !this.issueKey || !this.summary){
      return false;
    }

    return !this.saving;
  }
  selectIssueType(event:Event,trigger: MatMenuTrigger,type: IssueType) {
    if (event)
      event.stopPropagation();
    this.issueType = type;
    this.loadNextKey();
    if (trigger)
      trigger.closeMenu();
  }

  clickMenu($event: MouseEvent) {
    if (!this.toClose) {
      $event.stopPropagation();
    } else {
      this.toClose = false;
    }
  }
  ngAfterViewInit(): void {
    this.toClose = false;


  }
  isSubtask(){
    if (this.isMaster)
      return false;
    return (this.parentIssue != undefined && this.parentIssue != null)
  }

  onOpen() {
    // Menu refermé pendant la question (clic en dehors) : on repart du
    // formulaire, la tâche existe déjà et reste non assignée.
    this.tacheCreee = undefined;
    this.loadNextKey();
  }
  getIssueTypeColor(type: IssueType | null | undefined): string {
    if (!type) return '#aaa';
    if (type.color)
      return type.color.toString();
    const name = (type.name || '').toLowerCase();
    if (name.includes('bug'))                          return '#e74c3c';
    if (name.includes('story'))                        return '#27ae60';
    if (name.includes('tâche') || name.includes('task')) return '#2980b9';
    if (name.includes('epic'))                         return '#8e44ad';
    if (name.includes('sub') || name.includes('sous')) return '#e67e22';
    return '#607d8b';
  }

  getIssueTypeClass(type: IssueType | null | undefined): string {
    if (!type) return '';
    if (type.color)
      return 'type-custom';
    const name = (type.name || '').toLowerCase();
    if (name.includes('bug'))                          return 'type-bug';
    if (name.includes('story'))                        return 'type-story';
    if (name.includes('tâche') || name.includes('task')) return 'type-task';
    if (name.includes('epic'))                         return 'type-epic';
    if (name.includes('sub') || name.includes('sous')) return 'type-sub';
    return '';
  }

  onIssueTypeSaved(issueType:IssueType) {
    // Le declencheur vit sous un *ngIf de droits : il peut ne pas exister.
    this.newIssueTypeTrigger?.closeMenu();
    this.menuTrigger.closeMenu();
    if (this.isSubtask()) {
      // Ses phases decident ou il apparait : la liste est relue.
      this.loadIssueTypeSubtask(issueType.id);
      return;
    }
    this.pushIssueType(issueType);
    this.issueType = issueType;
    this.loadNextKey();
  }

  onMenuIssuetypeOpened() {
    if (this.isMaster) {
      this.issutypeForm.setLevel('PARENT');
      this.issutypeForm.setParent(undefined);
    } else {
      this.issutypeForm.setLevel('SUB_TASK');
      this.issutypeForm.setParent(this.parentIssue.issueType);
    }
  }
  pushIssueType(issueType){
    if (!this.useIssueType)
      this.useIssueType = [];
    this.useIssueType.push(issueType);
  }
  setIsMaster(b: boolean) {
    this.isMaster = b;
  }

  /**
   * Impose le statut de la tâche à créer, ou le rend au flux de travail avec
   * null. Le formulaire reste ouvert après une création : le statut est
   * conservé, pour enchaîner plusieurs tâches dans la même colonne.
   */
  setStatus(status: Status | null) {
    this.status = status;
  }
}
