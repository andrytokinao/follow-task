import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {forkJoin, Observable} from "rxjs";
import {IssueType, Phase, Project, Status} from "../../../../../../type/issue";
import {PhaseService} from "../../../../../../services/phase.service";
import {deplacer, nombreDeTypes, statutsDansEspace, statutsLibres} from "../../../../../../type/phase.util";

/**
 * Paramétrage des phases de projet d'un espace de travail : nom, portée
 * (cet espace ou commune à tous), ordre, et statuts du projet pendant
 * lesquels chaque phase est la phase courante.
 *
 * Les phases d'un type se choisissent dans le formulaire du type.
 */
@Component({
  selector: 'app-phase-manager',
  standalone: false,
  templateUrl: './phase-manager.component.html',
  styleUrls: ['./phase-manager.component.css']
})
export class PhaseManagerComponent implements OnChanges {

  @Input() project: Project | undefined;
  /** Types principaux de l'espace, avec leurs sous-types : pour compter les types d'une phase. */
  @Input() issueTypes: IssueType[] = [];
  /** Une phase a été renommée ou supprimée : les types qui l'affichent sont à recharger. */
  @Output() changed = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  phases: Phase[] = [];
  /** Statuts que peut prendre un projet de l'espace. */
  statutsEspace: Status[] = [];
  /** Nom en cours de saisie de chaque phase, par id. */
  noms: { [id: number]: string } = {};
  /** Statuts de l'espace liés à chaque phase, par id de phase. */
  statutsParPhase: { [id: number]: Status[] } = {};
  /** Statuts de l'espace qui ne désignent encore aucune phase. */
  statutsDisponibles: Status[] = [];
  nouveauNom = '';
  nouvelleCommune = false;
  errorMessage = '';
  enCours = false;

  constructor(private phaseService: PhaseService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project']) {
      this.charger();
    }
  }

  // ---- lecture ----

  charger(): void {
    if (this.project?.id == null) {
      return;
    }
    const projectId = Number(this.project.id);
    forkJoin({
      phases: this.phaseService.phasesByProject(projectId),
      statuts: this.phaseService.statutsProjet(projectId)
    }).subscribe({
      next: ({phases, statuts}) => {
        this.statutsEspace = statuts;
        this.afficher(phases);
      },
      error: error => this.signaler(error)
    });
  }

  /**
   * Les listes affichées sont calculées ici, une fois par chargement : des
   * getters rendraient un nouveau tableau à chaque détection de changement.
   */
  private afficher(phases: Phase[]): void {
    this.phases = phases;
    this.noms = {};
    this.statutsParPhase = {};
    phases.forEach(phase => {
      this.noms[phase.id!] = phase.name || '';
      this.statutsParPhase[phase.id!] = statutsDansEspace(phase, this.statutsEspace);
    });
    this.statutsDisponibles = statutsLibres(phases, this.statutsEspace);
  }

  nombreDeTypes(phase: Phase): number {
    return nombreDeTypes(phase, this.issueTypes);
  }

  estRenommee(phase: Phase): boolean {
    const nom = (this.noms[phase.id!] || '').trim();
    return !!nom && nom != phase.name;
  }

  // ---- commandes ----

  ajouter(): void {
    const name = this.nouveauNom.trim();
    if (!name || !this.project?.id) {
      return;
    }
    this.executer(this.phaseService.savePhase({name, commune: this.nouvelleCommune, project: {id: this.project.id}}),
      () => {
        this.nouveauNom = '';
        this.nouvelleCommune = false;
        this.charger();
      });
  }

  renommer(phase: Phase): void {
    if (!this.estRenommee(phase)) {
      return;
    }
    this.executer(this.phaseService.savePhase({id: phase.id, name: this.noms[phase.id!].trim()}),
      () => this.rechargerTout());
  }

  /** Commune à tous les espaces, ou réservée à celui-ci. */
  changerPortee(phase: Phase): void {
    const commune = !phase.commune;
    const question = commune
      ? "Rendre la phase « " + phase.name + " » commune à tous les espaces de travail ?"
      : "Réserver la phase « " + phase.name + " » à cet espace de travail ?";
    if (!confirm(question)) {
      return;
    }
    this.executer(this.phaseService.savePhase({id: phase.id, name: phase.name, commune, project: this.project}),
      () => this.charger());
  }

  deplacer(index: number, sens: -1 | 1): void {
    const ordre = deplacer(this.phases, index, sens);
    if (ordre === this.phases) {
      return;
    }
    this.phases = ordre;
    this.executer(this.phaseService.ordonnerPhases(ordre.map(phase => phase.id!)), () => this.changed.emit());
  }

  supprimer(phase: Phase): void {
    const count = this.nombreDeTypes(phase);
    const detail = count ? " Ses " + count + " type(s) et ses tâches seront conservés, sans cette phase." : "";
    if (!confirm("Supprimer la phase « " + phase.name + " » ?" + detail)) {
      return;
    }
    this.executer(this.phaseService.deletePhase(phase.id!), () => this.rechargerTout());
  }

  lier(phase: Phase, statusId: string): void {
    if (!statusId) {
      return;
    }
    this.executer(this.phaseService.lierStatut(phase.id!, Number(statusId)), () => this.charger());
  }

  delier(phase: Phase, status: Status): void {
    this.executer(this.phaseService.delierStatut(phase.id!, status.id), () => this.charger());
  }

  trackByPhase(index: number, phase: Phase): number | undefined {
    return phase.id;
  }

  // ---- interne ----

  /** Les types affichent le nom de leurs phases : ils sont rechargés aussi. */
  private rechargerTout(): void {
    this.charger();
    this.changed.emit();
  }

  private executer<T>(action: Observable<T>, ensuite: () => void): void {
    this.errorMessage = '';
    this.enCours = true;
    action.subscribe({
      next: () => {
        this.enCours = false;
        ensuite();
      },
      error: error => {
        this.enCours = false;
        this.signaler(error);
        this.charger();
      }
    });
  }

  private signaler(error: any): void {
    const graphQlMessage = error?.graphQLErrors?.length ? error.graphQLErrors[0].message : null;
    this.errorMessage = graphQlMessage || error?.message || "L'opération a échoué.";
  }
}
