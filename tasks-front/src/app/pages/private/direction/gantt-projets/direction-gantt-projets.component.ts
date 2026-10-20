import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {forkJoin, Observable, of, Subscription} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {EventMenuComponent} from '../../../../common/event-menu/event-menu.component';
import {EventsService} from '../../../../services/events.service';
import {UserService} from '../../../../services/user.service';
import {EventApp, Issue, User} from '../../../../type/issue';
import {UNASSIGNED_ID, userDisplayName} from '../../../../type/issue-grouping.util';
import {DirectionService} from '../direction.service';
import {EspaceDirection, PlageMembre, PlageTache, ProjetGantt, TacheGantt} from '../direction.model';
import {EspaceDirectionService} from '../espace/espace-direction.service';
import {bulleDeSerie, bulleSimple, ContenuBulle} from './gantt-bulle';
import {versIso} from './gantt-dates.util';
import {AxeGantt, EchelleGantt, FenetreGantt} from './gantt-fenetre';
import {IntervenantsGantt} from './gantt-personnes';
import {ActivitesGantt, placerEvenements} from './gantt-evenements';
import {cleRepere, construireBlocs, EntreesStructure, indexerChamps, rafraichirDemande} from './gantt-projets.constructeur';
import {BlocGantt, ChampGantt, LigneGantt, PartieGantt, PlanGantt, RepereGantt, Serie} from './gantt-projets.model';
import {PAR_TACHE, Regroupement, REGROUPEMENTS} from './gantt-regroupement';
import {annuaire, CaseEffectif, effectifsParProjet, PersonneEffectif} from './gantt-effectifs';
import {CasePresence, presencesParCase} from './gantt-presences';
import {presencesParJour} from './gantt-absences';
import {GanttChampsCaseComponent, ValeursModifiees} from './champs-case/gantt-champs-case.component';
import {avecValeurs, caseDe} from './champs-case/gantt-champs-case';
import {REPLI_GANTT} from './gantt-animations';
import {TOUT_VISIBLE, visibilite} from './gantt-visibilite';

/** Géométrie d'une ligne de tâche, en pixels : voir la feuille de styles. */
const HAUT_CADRE = 8;
const HAUT_REEL = 20;
const HAUT_VOIE = 16;
/** Sous le cadre : la rangée des pastilles. */
const BAS_LIGNE = 30;

/** Durée du clignotement de la barre d'une date tout juste posée : celle de l'animation. */
const DUREE_REPERE_RECENT = 2400;

/** Infobulle et sa place à l'écran. */
type Bulle = ContenuBulle & {
  x: number;
  y: number;
  /** Ancrée par le bas quand le pointeur est en bas de l'écran. */
  versLeHaut: boolean;
};

/**
 * Gantt de direction (`/direction/TOPO/gantt`) : les projets en cours de l'espace du menu, chacun
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
 *
 * Réutilisable : l'hôte fournit l'espace à suivre (`[espace$]`), le diagramme
 * se recharge à chaque émission. Sans lui, c'est l'espace du menu de direction.
 */
@Component({
  standalone: false,
  selector: 'app-direction-gantt-projets',
  templateUrl: './direction-gantt-projets.component.html',
  styleUrls: ['./direction-gantt-projets.component.css'],
  animations: [REPLI_GANTT]
})
export class DirectionGanttProjetsComponent implements OnInit, OnDestroy {

  /**
   * Espace dont les projets sont affichés, lu une fois à l'initialisation :
   * c'est le flux, pas sa valeur, qui porte les changements d'espace.
   * Par défaut, l'espace du menu de direction.
   */
  @Input() espace$?: Observable<EspaceDirection>;

  @ViewChild(EventMenuComponent) private eventMenu!: EventMenuComponent;
  @ViewChild(GanttChampsCaseComponent) private champsCase!: GanttChampsCaseComponent;

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

  /** Espace de travail du menu : ses projets seuls sont affichés. */
  espace: EspaceDirection | null = null;
  fenetre = FenetreGantt.autour('jour', Date.now());
  /** Ce que liste chaque projet : ses tâches, ou des groupes de tâches. */
  regroupement: Regroupement = PAR_TACHE;
  /** Identifiants des personnes choisies ; vide : tout le monde. */
  selection: string[] = [];
  replies = new Set<number>();
  /** Lignes et projets qui ne concernent pas les personnes choisies : masqués. */
  visibles = TOUT_VISIBLE;
  /** Replis animés une fois des personnes choisies, pas au chargement de la page. */
  animer = false;

  /** Structure : projets, tâches, cadres, champs datés. */
  blocs: BlocGantt[] = [];
  /** Activité : réalisé et planifié, par tâche. Remplacée seule quand la sélection change. */
  activites = ActivitesGantt.AUCUNE;
  /** Nombre de personnes au travail sur la période, par projet. */
  effectifs = new Map<number, number>();
  /** Ces personnes, par projet : la liste du menu du total. */
  equipes = new Map<number, PersonneEffectif[]>();
  /** Personnes au travail case par case (jour, semaine, mois), par projet. */
  effectifsParCase = new Map<number, CaseEffectif[]>();
  /** Rangée « Sans planning » de l'en-tête. */
  presences: CasePresence[] = [];
  /** Onglet du menu d'une case : sans planning d'abord, s'il y a des absents ; les managers à part. */
  ongletPresence: 'sans' | 'avec' | 'managers' = 'sans';
  axe: AxeGantt = {groupes: [], graduations: [], weekends: []};
  /** Position du trait « aujourd'hui » ; null hors de la fenêtre. */
  aujourdhui: number | null = null;
  champs: ChampGantt[] = [];
  /** Tâches des projets affichés, avec assignés et intervenants : la matière du filtre des personnes. */
  taches: Issue[] = [];
  /** Membres actifs des espaces de travail affichés : proposés au filtre même sans tâche. */
  membres: User[] = [];

  bulle: Bulle | null = null;
  /** Clé de la barre d'une date tout juste posée (`cleRepere`) : elle clignote. */
  repereRecent: string | null = null;
  private minuterieRecent?: ReturnType<typeof setTimeout>;

  private static readonly CLE_LEGENDE = 'direction-gantt-legende';
  /** Légende dépliée ; repliée par défaut pour laisser la hauteur au diagramme. */
  legendeVisible = localStorage.getItem(DirectionGanttProjetsComponent.CLE_LEGENDE) === 'true';

  projets: ProjetGantt[] = [];
  /** Derniers événements reçus : reposés tels quels quand seul le regroupement change. */
  private evenements: EventApp[] = [];
  private ligneDeTache = new Map<number, string>();
  private projetDeTache = new Map<number, number>();
  /** Séances des projets affichés : la matière de l'effectif par jour. */
  private plagesProjets: PlageTache[] = [];
  private abonnementEffectifs?: Subscription;
  private abonnementPresences?: Subscription;
  private readonly intervenants = new IntervenantsGantt();
  private abonnement?: Subscription;
  private abonnementMembres?: Subscription;
  private abonnementEspace?: Subscription;
  /** Membres déjà chargés, par préfixe d'espace de travail. */
  private readonly membresParEspace = new Map<string, User[]>();
  /** Managers déjà chargés, par préfixe d'espace de travail. */
  private readonly managersParEspace = new Map<string, User[]>();

  constructor(private directionService: DirectionService,
              private eventsService: EventsService,
              private userService: UserService,
              private espaceService: EspaceDirectionService) {
  }

  /** Les projets sont ceux de l'espace suivi : en changer recharge la page. */
  ngOnInit(): void {
    this.abonnementEspace = (this.espace$ ?? this.espaceService.espace$).pipe(
      tap(espace => {
        this.espace = espace;
        this.chargement = true;
        this.erreur = false;
        this.replies.clear();
        this.animer = false;
      }),
      // L'échec reste dans l'espace en cause : changer d'espace recharge encore.
      switchMap(espace => this.directionService.ganttProjets(espace.nom).pipe(catchError(() => of(null))))
    ).subscribe(projets => {
      this.chargement = false;
      this.erreur = projets == null;
      this.projets = projets ?? [];
      this.champs = indexerChamps(this.projets);
      this.structurer();
    });
  }

  ngOnDestroy(): void {
    this.abonnement?.unsubscribe();
    this.abonnementMembres?.unsubscribe();
    this.abonnementEspace?.unsubscribe();
    this.abonnementPresences?.unsubscribe();
    this.abonnementEffectifs?.unsubscribe();
    clearTimeout(this.minuterieRecent);
  }

  // ---------------------------------------------------------------- commandes

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
    this.animer = true;
    this.chercher();
    this.calculerEffectifs();
  }

  basculerLegende(): void {
    this.legendeVisible = !this.legendeVisible;
    localStorage.setItem(DirectionGanttProjetsComponent.CLE_LEGENDE, String(this.legendeVisible));
  }

  basculerProjet(bloc: BlocGantt): void {
    const id = bloc.projet.id as number;
    if (!this.replies.delete(id)) {
      this.replies.add(id);
    }
  }

  // ---------------------------------------------------------------- données

  /**
   * Membres des espaces de travail des projets affichés, ceux que
   * l'assignation propose (`UserService.getUsersForProject`). Un espace
   * n'est demandé qu'une fois.
   */
  private chargerMembres(): void {
    this.abonnementMembres?.unsubscribe();
    const prefixes = [...new Set(this.projets
      .map(p => p.rapportProjet?.prefixeDepartement)
      .filter((prefixe): prefixe is string => !!prefixe))];
    if (!prefixes.length) {
      this.membres = [];
      return;
    }
    this.abonnementMembres = forkJoin(prefixes.map(prefixe => this.membresDe(prefixe)))
      // Une personne membre de plusieurs groupes ou espaces n'est proposée qu'une fois.
      .subscribe(parEspace => {
        this.membres = [...new Map(parEspace.flat().map(m => [m.id, m])).values()];
        // Les noms des personnes de l'effectif viennent des membres.
        this.calculerEffectifs();
      });
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
    this.chargerPresences();
    this.chargerEffectifs();
  }

  /**
   * Membres de l'espace sans planning sur la fenêtre (`presencesParJour`) :
   * d'abord tous les membres, puis le temps occupé par toutes leurs séances,
   * tous projets confondus. `plagesMembres` et non `searchEvents` : ce dernier
   * écarte les séances sans fin ou à cheval sur la période, et leurs auteurs
   * passaient pour absents. Ne dépend ni des personnes choisies ni du
   * regroupement : c'est toute l'équipe. Les managers de l'espace n'y comptent
   * pas : ils ont leur liste à part dans le menu d'une case.
   */
  private chargerPresences(): void {
    this.abonnementPresences?.unsubscribe();
    this.presences = [];
    if (!this.espace) {
      return;
    }
    const fenetre = this.fenetre;
    const prefixe = this.espace.prefixe;
    this.abonnementPresences = forkJoin({membres: this.membresDe(prefixe), managers: this.managersDe(prefixe)}).pipe(
      switchMap(({membres, managers}) => !membres.length
        ? of({membres, managers, plages: [] as PlageMembre[]})
        : this.directionService.plagesMembres(membres.map(m => m.id), versIso(fenetre.debut), versIso(fenetre.fin))
          .pipe(map(plages => ({membres, managers, plages})))),
      // Sans elles, pas de rangée plutôt qu'une rangée fausse : le diagramme reste utile.
      catchError(() => of(null))
    ).subscribe(resultat => {
      if (!resultat) {
        this.presences = [];
        return;
      }
      const estManager = new Set(resultat.managers.map(m => m.id));
      const jours = (personnes: User[]) => presencesParJour(personnes, resultat.plages, fenetre.debut, fenetre.fin, Date.now());
      this.presences = presencesParCase(
        jours(resultat.membres.filter(m => !estManager.has(m.id))), fenetre,
        jours(resultat.membres.filter(m => estManager.has(m.id))));
    });
  }

  /** Managers de l'espace (rôle PROJECT_MANAGER), demandés une fois par espace. */
  private managersDe(prefixe: string): Observable<User[]> {
    const connus = this.managersParEspace.get(prefixe);
    if (connus) {
      return of(connus);
    }
    return this.userService.getUserForProjectAndRole(prefixe, ['PROJECT_MANAGER']).pipe(
      tap(managers => this.managersParEspace.set(prefixe, managers)),
      // Sans eux, les managers restent dans l'équipe, comme avant.
      catchError(() => of([] as User[])));
  }

  private construire(): void {
    const maintenant = Date.now();
    this.axe = this.fenetre.axe(maintenant);
    this.aujourdhui = this.fenetre.contient(maintenant) ? this.fenetre.x(maintenant) : null;
    this.blocs = construireBlocs(this.entrees(maintenant));
    // Chaque tâche mène à sa ligne : c'est par là que ses événements la rejoignent.
    this.ligneDeTache = new Map(this.blocs.flatMap(bloc =>
      bloc.lignes.flatMap(l => l.taches.map(tache => [tache.id as number, l.cle] as [number, string]))));
    // Et à son projet : l'effectif par jour se compte par projet.
    this.projetDeTache = new Map(this.blocs.flatMap(bloc =>
      bloc.lignes.flatMap(l => l.taches.map(tache => [tache.id as number, bloc.projet.id as number] as [number, number]))));
  }

  private entrees(maintenant: number): EntreesStructure {
    return {
      projets: this.projets,
      fenetre: this.fenetre,
      maintenant,
      champs: this.champs,
      regroupement: this.regroupement
    };
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

  /**
   * Séances des projets affichés sur la fenêtre, pour l'effectif par jour.
   * `plagesProjets` et non les événements de l'activité : la recherche
   * d'événements écarte les séances sans fin ou à cheval sur la période.
   */
  private chargerEffectifs(): void {
    this.abonnementEffectifs?.unsubscribe();
    this.plagesProjets = [];
    this.calculerEffectifs();
    if (!this.blocs.length) {
      return;
    }
    this.abonnementEffectifs = this.directionService.plagesProjets(this.blocs.map(bloc => bloc.projet.id as number),
      versIso(this.fenetre.debut), versIso(this.fenetre.fin))
      // Sans elles, pas d'effectif plutôt qu'un effectif faux.
      .pipe(catchError(() => of([] as PlageTache[])))
      .subscribe(plages => {
        this.plagesProjets = plages;
        this.calculerEffectifs();
      });
  }

  /** Effectif par jour et total sur la fenêtre, pour les personnes choisies. */
  private calculerEffectifs(): void {
    const effectifs = effectifsParProjet(this.plagesProjets, this.fenetre,
      tacheId => this.projetDeTache.get(tacheId),
      this.selection.filter(id => id !== UNASSIGNED_ID),
      annuaire([...this.membres, ...this.taches.flatMap(t => t.assigne ? [t.assigne] : [])]));
    this.effectifsParCase = effectifs.parCase;
    this.effectifs = effectifs.totaux;
    this.equipes = effectifs.equipes;
  }

  /** Pose des événements sur le diagramme en place. */
  private poser(evenements: EventApp[]): void {
    this.evenements = evenements;
    this.activites = placerEvenements(evenements, this.fenetre, Date.now(), tacheId => this.ligneDeTache.get(tacheId));
    // Après la recherche : les séances des personnes choisies disent aussi quelles tâches les concernent.
    this.visibles = visibilite(this.blocs, this.selection, this.activites);
    this.intervenants.retenir(evenements);
    this.taches = this.intervenants.completer(this.blocs.flatMap(bloc => bloc.projet.children ?? []));
  }

  // ---------------------------------------------------------------- survol

  /** Ce qui a réellement été fait pendant cette partie, séance par séance. */
  survolerPartie(ligne: LigneGantt, partie: PartieGantt, event: MouseEvent): void {
    this.montrer(event, bulleDeSerie(this.titre(ligne), partie.serie));
  }

  survolerPlan(ligne: LigneGantt, plan: PlanGantt, event: MouseEvent): void {
    this.montrer(event, bulleDeSerie(this.titre(ligne), plan.serie));
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

  /** Une case d'effectif : qui, ce jour-là. */
  survolerCase(cellule: CaseEffectif, event: MouseEvent): void {
    this.montrer(event, bulleSimple(cellule.titre, cellule.detail));
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
      // La fiche de la séance, pas le menu des champs de la case en dessous.
      event.stopPropagation();
      this.bulle = null;
      this.eventMenu.ouvrirConsultation(id, event);
    }
  }

  /** Clic dans la piste d'un projet ou d'une tâche : les champs datés de la case sous le pointeur. */
  ouvrirChamps(demande: TacheGantt, bloc: BlocGantt, event: MouseEvent): void {
    if (!demande.issueType?.id) {
      return;
    }
    const piste = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const prefixe = bloc.projet.rapportProjet?.prefixeDepartement ?? this.espace?.prefixe ?? null;
    this.bulle = null;
    this.champsCase.ouvrir(caseDe(demande, prefixe, this.fenetre, event.clientX - piste.left), event);
  }

  /**
   * Une date posée ou retirée : seuls les repères de la demande en cause sont
   * refaits ; le reste du diagramme et l'activité restent en place.
   */
  champsModifies(modif: ValeursModifiees): void {
    this.projets = avecValeurs(this.projets, modif.issueId, modif.valeurs);
    this.champs = indexerChamps(this.projets, this.champs);
    this.blocs = rafraichirDemande(this.blocs, modif.issueId, this.entrees(Date.now()));
    this.signaler(modif);
  }

  /** La barre d'une date tout juste posée clignote un instant : on la voit apparaître. */
  private signaler(modif: ValeursModifiees): void {
    clearTimeout(this.minuterieRecent);
    this.repereRecent = modif.posee ? cleRepere(modif.issueId, modif.posee.champId, modif.posee.jour) : null;
    if (this.repereRecent) {
      this.minuterieRecent = setTimeout(() => this.repereRecent = null, DUREE_REPERE_RECENT);
    }
  }

  private montrer(event: MouseEvent, contenu: ContenuBulle): void {
    this.bulle = {...contenu, ...this.position(event)};
  }

  private titre(ligne: LigneGantt): string {
    return ligne.tache
      ? `${ligne.tache.issueKey} · ${ligne.tache.summary}`
      : `${ligne.nom} · ${ligne.taches.length} tâche(s)`;
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
