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
import { Issue, IssueType, Project, Status } from '../../type/issue';
import { IssueService } from '../../services/issue.service';
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
  status: Status | null = null;
  project: Project | undefined;
  allIssueTypes: IssueType[] = [];
  useIssueType: IssueType[] = [];
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
   * panneau. Pour une tâche, c'est après la réponse à « vous assigner ? » ;
   * pour un projet, aussitôt après `saved`.
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
   * Case « M'assigner », pour un projet seulement. Une tâche pose la question
   * après sa création (app-question-assignation) : la case ferait doublon.
   * Aucun droit requis pour s'assigner (IssueAccessService.checkCanAssignSelf).
   */
  assignerMoi = false;

  constructor(public issueService: IssueService,
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

    if (this.parentIssue && !this.isMaster) {
      issue.parent = { id: this.parentIssue.id };
    }

    const estTache = this.isSubtask();

    // Projet : la case « M'assigner » est traitée avant `saved`, pour que la
    // liste rechargée par l'hôte le montre déjà assigné. Son échec ne défait
    // pas la création : on le signale seulement.
    this.issueService.saveIssue(issue).pipe(
      switchMap(cree => estTache || !this.assignerMoi || !cree?.id
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
        // Toute création de tâche, quel que soit l'écran, demande si on se
        // l'assigne. Le panneau reste ouvert sur la question.
        if (estTache && res?.id) {
          this.tacheCreee = res;
          return;
        }
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

  loadIssueTypeSubtask() {
    this.isDesable = true;
    this.useIssueType = [];
    this.issueType = undefined;
    this.issueKey = '';

    this.issueService.listIssueTypeSubtasks(this.parentIssue.issueType.id).subscribe(types => {
      this.useIssueType = types;
      if (this.useIssueType.length) {
        this.issueType = this.useIssueType[0];
        this.loadNextKey();
      }
    });
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
}
