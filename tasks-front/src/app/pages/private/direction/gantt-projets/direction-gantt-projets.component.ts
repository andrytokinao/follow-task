import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {forkJoin, Observable, of, Subscription} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {EventMenuComponent} from '../../../../common/event-menu/event-menu.component';
import {EventsService} from '../../../../services/events.service';
import {UserService} from '../../../../services/user.service';
import {EventApp, Issue, User} from '../../../../type/issue';
import {UNASSIGNED_ID, userDisplayName} from '../../../../type/issue-grouping.util';
import {DirectionService} from '../direction.service';
import {ProjetGantt, TacheGantt} from '../direction.model';
import {bulleDeSerie, bulleSimple, ContenuBulle, periode} from './gantt-bulle';
import {versIso} from './gantt-dates.util';
import {AxeGantt, EchelleGantt, FenetreGantt} from './gantt-fenetre';
import {IntervenantsGantt} from './gantt-personnes';
import {ActivitesGantt, placerEvenements} from './gantt-evenements';
import {construireBlocs, indexerChamps} from './gantt-projets.constructeur';
import {BlocGantt, ChampGantt, LigneGantt, PartieGantt, PlanGantt, RepereGantt, Serie} from './gantt-projets.model';
import {PAR_TACHE, Regroupement, REGROUPEMENTS} from './gantt-regroupement';

/** Géométrie d'une ligne de tâche, en pixels : voir la feuille de styles. */
const HAUT_CADRE = 8;
const HAUT_REEL = 20;
const HAUT_VOIE = 16;
/** Sous le cadre : la rangée des pastilles. */
const BAS_LIGNE = 30;

/** Infobulle et sa place à l'écran. */
type Bulle = ContenuBulle & {
  x: number;
  y: number;
  /** Ancrée par le bas quand le pointeur est en bas de l'écran. */
  versLeHaut: boolean;
};

/**
 * Gantt de direction (`/direction/gantt`) : tous les projets en cours, chacun
 * avec le diagramme de ses tâches.
 *
 * Une tâche est un cadre, du démarrage à la deadline. Dedans, une seule bande :
 * les séances de planning passées sont le réalisé, découpé en parties selon les
 * personnes au travail ; celles à venir sont la planification, en pointillé,
 * par personne. Une séance planifiée devient du réalisé en passant. Les
 * champs personnalisés de type Date sont des barres verticales : sur tout le
 * bloc pour ceux du projet, sur sa ligne pour ceux d'une tâche.
 *
 * La page ne porte que son état et ses commandes, et tient deux couches
 * indépendantes : la structure (`construireBlocs` : projets, tâches, cadres) et
 * l'activité (`placerEvenements` : les événements de planning rendus par
 * `EventsService.searchEvents`). Choisir une personne ne refait que la seconde.
 */
@Component({
  standalone: false,
  selector: 'app-direction-gantt-projets',
  templateUrl: './direction-gantt-projets.component.html',
  styleUrls: ['./direction-gantt-projets.component.css']
})
export class DirectionGanttProjetsComponent implements OnInit, OnDestroy {

  @ViewChild(EventMenuComponent) private eventMenu!: EventMenuComponent;

  readonly echelles: { valeur: EchelleGantt; libelle: string }[] = [
    {valeur: 'jour', libelle: 'Jour'},
    {valeur: 'semaine', libelle: 'Semaine'},
    {valeur: 'mois', libelle: 'Mois'},
  ];

  readonly regroupements = REGROUPEMENTS;

  chargement = true;
  erreur = false;
  /** Recherche d'événements en cours : le diagramme reste affiché. */
  recherche = false;

  departements: string[] = [];
  /** null : tous les départements. */
  departement: string | null = null;
  fenetre = FenetreGantt.autour('jour', Date.now());
  /** Ce que liste chaque projet : ses tâches, ou des groupes de tâches. */
  regroupement: Regroupement = PAR_TACHE;
  /** Identifiants des personnes choisies ; vide : tout le monde. */
  selection: string[] = [];
  replies = new Set<number>();

  /** Structure : projets, tâches, cadres, champs datés. */
  blocs: BlocGantt[] = [];
  /** Activité : réalisé et planifié, par tâche. Remplacée seule quand la sélection change. */
  activites = ActivitesGantt.AUCUNE;
  /** Nombre de personnes au travail sur la période, par projet. */
  effectifs = new Map<number, number>();
  axe: AxeGantt = {groupes: [], graduations: [], weekends: []};
  /** Position du trait « aujourd'hui » ; null hors de la fenêtre. */
  aujourdhui: number | null = null;
  champs: ChampGantt[] = [];
  /** Tâches des projets affichés, avec assignés et intervenants : la matière du filtre des personnes. */
  taches: Issue[] = [];
  /** Membres actifs des espaces de travail affichés : proposés au filtre même sans tâche. */
  membres: User[] = [];

  bulle: Bulle | null = null;

  private projets: ProjetGantt[] = [];
  /** Derniers événements reçus : reposés tels quels quand seul le regroupement change. */
  private evenements: EventApp[] = [];
  private ligneDeTache = new Map<number, string>();
  private readonly intervenants = new IntervenantsGantt();
  private abonnement?: Subscription;
  private abonnementMembres?: Subscription;
  /** Membres déjà chargés, par préfixe d'espace de travail. */
  private readonly membresParEspace = new Map<string, User[]>();

  constructor(private directionService: DirectionService,
              private eventsService: EventsService,
              private userService: UserService) {
  }

  ngOnInit(): void {
    this.directionService.ganttProjets().subscribe({
      next: ({departements, projets}) => {
        this.departements = departements;
        this.projets = projets;
        this.champs = indexerChamps(projets);
        this.chargement = false;
        this.structurer();
      },
      error: () => {
        this.chargement = false;
        this.erreur = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.abonnement?.unsubscribe();
    this.abonnementMembres?.unsubscribe();
  }

  // ---------------------------------------------------------------- commandes

  choisirDepartement(departement: string | null): void {
    this.departement = departement;
    this.structurer();
  }

  choisirEchelle(echelle: EchelleGantt): void {
    this.fenetre = FenetreGantt.autour(echelle, Date.now());
    this.structurer();
  }

  /** Recule (-1) ou avance (1) la fenêtre d'un pas. */
  deplacer(sens: number): void {
    this.fenetre = this.fenetre.decaler(sens);
    this.structurer();
  }

  revenirAujourdhui(): void {
    this.choisirEchelle(this.fenetre.echelle);
  }

  /** Les lignes changent, pas les données : les événements déjà reçus sont reposés, sans nouvelle recherche. */
  choisirRegroupement(regroupement: Regroupement): void {
    this.regroupement = regroupement;
    this.bulle = null;
    this.construire();
    this.poser(this.evenements);
  }

  /** Seuls les événements changent : projets, tâches et cadres restent en place. */
  choisirPersonnes(ids: string[]): void {
    this.selection = ids;
    this.chercher();
  }

  basculerProjet(bloc: BlocGantt): void {
    const id = bloc.projet.id as number;
    if (!this.replies.delete(id)) {
      this.replies.add(id);
    }
  }

  nombreProjets(departement: string | null): number {
    return this.projetsDe(departement).length;
  }

  // ---------------------------------------------------------------- données

  private projetsDe(departement: string | null): ProjetGantt[] {
    return departement == null
      ? this.projets
      : this.projets.filter(p => p.rapportProjet?.departement === departement);
  }

  /**
   * Membres des espaces de travail des projets affichés, ceux que
   * l'assignation propose (`UserService.getUsersForProject`). Un espace
   * n'est demandé qu'une fois.
   */
  private chargerMembres(): void {
    this.abonnementMembres?.unsubscribe();
    const prefixes = [...new Set(this.projetsDe(this.departement)
      .map(p => p.rapportProjet?.prefixeDepartement)
      .filter((prefixe): prefixe is string => !!prefixe))];
    if (!prefixes.length) {
      this.membres = [];
      return;
    }
    this.abonnementMembres = forkJoin(prefixes.map(prefixe => this.membresDe(prefixe)))
      // Une personne membre de plusieurs groupes ou espaces n'est proposée qu'une fois.
      .subscribe(parEspace => this.membres = [...new Map(parEspace.flat().map(m => [m.id, m])).values()]);
  }

  private membresDe(prefixe: string): Observable<User[]> {
    const connus = this.membresParEspace.get(prefixe);
    if (connus) {
      return of(connus);
    }
    return this.userService.getUsersForProject(prefixe).pipe(
      tap(membres => this.membresParEspace.set(prefixe, membres)),
      // Sans les membres, le filtre garde les assignés et les intervenants.
      catchError(() => of([] as User[])));
  }

  /**
   * Couche « structure » : les projets du département sur la fenêtre. Refaite
   * quand l'un des deux change, puis suivie de la recherche des événements.
   */
  private structurer(): void {
    this.construire();
    this.chargerMembres();
    this.chercher();
  }

  private construire(): void {
    const maintenant = Date.now();
    this.axe = this.fenetre.axe(maintenant);
    this.aujourdhui = this.fenetre.contient(maintenant) ? this.fenetre.x(maintenant) : null;
    this.blocs = construireBlocs({
      projets: this.projetsDe(this.departement),
      fenetre: this.fenetre,
      maintenant,
      champs: this.champs,
      regroupement: this.regroupement
    });
    // Chaque tâche mène à sa ligne : c'est par là que ses événements la rejoignent.
    this.ligneDeTache = new Map(this.blocs.flatMap(bloc =>
      bloc.lignes.flatMap(l => l.taches.map(tache => [tache.id as number, l.cle] as [number, string]))));
  }

  /**
   * Couche « activité » : les événements de planning des projets affichés, sur
   * la fenêtre, pour les personnes choisies. C'est la recherche d'événements
   * des plannings, avec ses critères ; leur placement se fait ici, dans le
   * navigateur (`placerEvenements`). La structure n'est pas touchée.
   */
  chercher(): void {
    this.abonnement?.unsubscribe();
    this.bulle = null;
    if (!this.blocs.length) {
      this.poser([]);
      return;
    }
    this.recherche = true;
    const termine = (evenements: EventApp[]) => {
      this.recherche = false;
      this.poser(evenements);
    };
    this.abonnement = this.eventsService.searchEvents({
      parrentIds: this.blocs.map(bloc => bloc.projet.id as number),
      userIds: this.selection.filter(id => id !== UNASSIGNED_ID),
      start: versIso(this.fenetre.debut),
      end: versIso(this.fenetre.fin)
    }).subscribe({
      next: evenements => termine(evenements ?? []),
      // Les cadres et les champs restent utiles sans les événements.
      error: () => termine([])
    });
  }

  /** Pose des événements sur le diagramme en place. */
  private poser(evenements: EventApp[]): void {
    this.evenements = evenements;
    this.activites = placerEvenements(evenements, this.fenetre, Date.now(), tacheId => this.ligneDeTache.get(tacheId));
    this.effectifs = new Map(this.blocs.map(bloc =>
      [bloc.projet.id as number, this.activites.personnes(bloc.lignes.map(l => l.cle)).length]));
    this.intervenants.retenir(evenements);
    this.taches = this.intervenants.completer(this.blocs.flatMap(bloc => bloc.projet.children ?? []));
  }

  // ---------------------------------------------------------------- survol

  /** Ce qui a réellement été fait pendant cette partie, séance par séance. */
  survolerPartie(ligne: LigneGantt, partie: PartieGantt, event: MouseEvent): void {
    const personnes = partie.serie.personnes;
    this.montrer(event, bulleDeSerie(this.titre(ligne),
      `Réalisé · ${periode(partie.serie)} — ${personnes.length} personne${personnes.length > 1 ? 's' : ''} au travail : `
      + personnes.map(userDisplayName).join(', '),
      partie.serie, true));
  }

  survolerPlan(ligne: LigneGantt, plan: PlanGantt, event: MouseEvent): void {
    this.montrer(event, bulleDeSerie(this.titre(ligne),
      `Planifié · ${periode(plan.serie)} — ${userDisplayName(plan.personne)}`, plan.serie, false));
  }

  survolerCadre(ligne: LigneGantt, event: MouseEvent): void {
    const cadre = ligne.cadre!;
    const jour = (t: number) => new Date(t).toLocaleDateString('fr-FR');
    this.montrer(event, bulleSimple(this.titre(ligne),
      `${jour(cadre.debut)} → ${jour(cadre.fin - 1)} — `
      + (cadre.sansEcheance ? 'sans deadline : étendue des séances' : 'démarrage → deadline')
      + ` · ${ligne.avancement} % avancé`
      + (ligne.retard ? ` · ${ligne.retard.jours} j de retard` : '')));
  }

  survolerRepere(repere: RepereGantt, event: MouseEvent): void {
    this.montrer(event, bulleSimple(repere.source,
      `${repere.nom} : ${new Date(repere.date).toLocaleDateString('fr-FR')}`));
  }

  suivre(event: MouseEvent): void {
    if (this.bulle) {
      this.bulle = {...this.bulle, ...this.position(event)};
    }
  }

  quitter(): void {
    this.bulle = null;
  }

  /** Clic sur une partie ou un plan d'une seule séance : sa fiche, comme dans les plannings. */
  ouvrir(serie: Serie, event: MouseEvent): void {
    const id = serie.seances.length === 1 ? serie.seances[0].evenement.id : null;
    if (id != null) {
      this.bulle = null;
      this.eventMenu.ouvrirConsultation(id, event);
    }
  }

  private montrer(event: MouseEvent, contenu: ContenuBulle): void {
    this.bulle = {...contenu, ...this.position(event)};
  }

  private titre(ligne: LigneGantt): string {
    return ligne.tache ? ` · ` : ` ·  tâche(s)`;
  }

  private position(event: MouseEvent): { x: number; y: number; versLeHaut: boolean } {
    const versLeHaut = event.clientY > window.innerHeight * 0.6;
    return {
      x: Math.min(event.clientX + 14, window.innerWidth - 380),
      y: versLeHaut ? window.innerHeight - event.clientY + 12 : event.clientY + 16,
      versLeHaut
    };
  }

  // ---------------------------------------------------------------- affichage

  /**
   * Hauteur du cadre. Réalisé et planifié partagent la même bande : le cadre
   * ne grandit que si plusieurs personnes ont du travail à venir en même temps.
   */
  hauteurCadre(voies: number): number {
    return 6 + Math.max(HAUT_REEL, voies * HAUT_VOIE);
  }

  hauteurLigne(voies: number): number {
    return HAUT_CADRE + this.hauteurCadre(voies) + BAS_LIGNE;
  }

  /** Haut d'une voie de planification dans sa ligne : la première est à la hauteur du réalisé. */
  hautVoie(voie: number): number {
    return HAUT_CADRE + 3 + voie * HAUT_VOIE;
  }

  /** Seule à venir, une personne occupe toute la bande, dans le prolongement du réalisé. */
  hauteurPlan(voies: number): number {
    return voies > 1 ? HAUT_VOIE - 2 : HAUT_REEL;
  }

  nomDe(personne: User | null | undefined): string {
    return userDisplayName(personne);
  }

  initiales(personne: User): string {
    return userDisplayName(personne).split(/\s+/).filter(Boolean).map(m => m[0]).slice(0, 2).join('').toUpperCase();
  }

  /** Sans photo, pas d'adresse : l'avatar montre alors les initiales. */
  photoDe(personne: User | null | undefined): string | null {
    return personne?.photo ? this.userService.getUrlPhoto(personne) : null;
  }

  parProjet(_: number, bloc: BlocGantt): unknown {
    return bloc.projet.id;
  }

  parLigne(_: number, ligne: LigneGantt): unknown {
    return ligne.cle;
  }
}
