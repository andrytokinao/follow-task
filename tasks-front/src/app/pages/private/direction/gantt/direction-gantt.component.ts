import {Component, Input, OnChanges, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs';
import {EventMenuComponent} from '../../../../common/event-menu/event-menu.component';
import {DirectionService} from '../direction.service';
import {ProjetDirection, RealisationTache, TacheGantt} from '../direction.model';

const JOUR = 24 * 60 * 60 * 1000;
const HEURE = 60 * 60 * 1000;

/** Finesse de l'axe du temps ; chaque échelle fixe la largeur d'un jour. */
export type EchelleGantt = 'jour' | 'semaine' | 'mois';

const PIXELS_PAR_JOUR: Record<EchelleGantt, number> = {jour: 34, semaine: 12, mois: 4};

/**
 * Ce que montre une barre. Dérivé de l'état d'exécution et, pour une séance
 * dont l'exécution n'a pas été déclarée, de sa place par rapport à maintenant :
 * passée, elle compte comme réalisée — c'est déjà la règle du temps passé et
 * de l'avancement dans toute l'application.
 */
export type AspectBarre = 'realisee' | 'en-cours' | 'prolongee' | 'bloquee' | 'reportee' | 'planifiee';

interface LegendeAspect {
  aspect: AspectBarre;
  libelle: string;
  icone: string;
}

/** Ordre de la légende : du fait vers le prévu, les difficultés au milieu. */
const LEGENDE: LegendeAspect[] = [
  {aspect: 'realisee', libelle: 'Réalisée', icone: 'fa-check'},
  {aspect: 'en-cours', libelle: 'En cours', icone: 'fa-play'},
  {aspect: 'prolongee', libelle: 'Prolongée', icone: 'fa-hourglass-half'},
  {aspect: 'bloquee', libelle: 'Bloquée', icone: 'fa-ban'},
  {aspect: 'reportee', libelle: 'Reportée', icone: 'fa-forward'},
  {aspect: 'planifiee', libelle: 'Planifiée', icone: 'fa-calendar'},
];

/** Une séance placée sur l'axe. */
export interface BarreGantt {
  realisation: RealisationTache;
  debut: number;
  fin: number;
  gauche: number;
  largeur: number;
  aspect: AspectBarre;
  libelle: string;
}

/** Une tâche : sa ligne du diagramme. */
export interface LigneGantt {
  tache: TacheGantt;
  avancement: number;
  barres: BarreGantt[];
  /** Du début de la première séance à la fin de la dernière ; null sans séance. */
  etendue: { gauche: number; largeur: number } | null;
  /** Période prévue, de la date de démarrage à la deadline ; null si l'une manque. */
  prevu: { gauche: number; largeur: number } | null;
  /** Deadline de la tâche (`date` : le jour saisi) ; `depassee` si la tâche n'est pas finie à temps. */
  echeance: { gauche: number; date: number; depassee: boolean } | null;
  /** Tâche non terminée : de sa deadline — à défaut, de la fin de sa dernière séance — à maintenant. */
  retard: { gauche: number; largeur: number; jours: number } | null;
  /** Position du pourcentage, à droite de tout ce que la ligne dessine. */
  finEtiquette: number;
}

/** Dépendance entre deux tâches dessinées : « A bloque B ». */
export interface FlecheGantt {
  chemin: string;
  titre: string;
}

/** Hauteur d'une ligne, filet du bas compris : voir --gantt-rang dans la feuille de styles. */
const RANG = 35;
/** Haut et bas d'une barre dans sa ligne, et son milieu. */
const BARRE_HAUT = 9;
const BARRE_BAS = 25;
const BARRE_MILIEU = 17;

interface Graduation {
  libelle: string;
  gauche: number;
  largeur: number;
}

/**
 * Diagramme de Gantt d'un projet, construit sur la réalisation : chaque tâche
 * a une ligne, chaque séance de planning une barre, colorée selon ce qui s'y
 * est passé (réalisée, en cours, bloquée, reportée...). Le pourcentage à droite
 * des barres est l'avancement actuel de la tâche.
 *
 * Pendant de `app-direction-projet-detail` (le tableau des tâches) : même
 * entrée, rechargé à chaque changement de projet. Lecture seule.
 */
@Component({
  standalone: false,
  selector: 'app-direction-gantt',
  templateUrl: './direction-gantt.component.html',
  styleUrls: ['./direction-gantt.component.css']
})
export class DirectionGanttComponent implements OnChanges {

  @Input({required: true}) projet!: ProjetDirection;

  @ViewChild(EventMenuComponent) private eventMenu!: EventMenuComponent;

  readonly legende = LEGENDE;
  readonly echelles: { valeur: EchelleGantt; libelle: string }[] = [
    {valeur: 'jour', libelle: 'Jour'},
    {valeur: 'semaine', libelle: 'Semaine'},
    {valeur: 'mois', libelle: 'Mois'},
  ];

  chargement = true;
  erreur = false;
  echelle: EchelleGantt = 'semaine';

  lignes: LigneGantt[] = [];
  /** Tâches sans séance ni date prévue : listées sous le diagramme, pas dessinées. */
  sansPlanning: TacheGantt[] = [];
  mois: Graduation[] = [];
  graduations: Graduation[] = [];
  largeur = 0;
  /** Position du trait « aujourd'hui » ; null s'il est hors de la période. */
  aujourdhui: number | null = null;
  /** Dépendances entre tâches du diagramme, tracées par-dessus les pistes. */
  fleches: FlecheGantt[] = [];
  /** Hauteur de l'en-tête : les flèches commencent dessous. */
  hautEntete = RANG;

  /** Barre survolée et position de l'infobulle, en coordonnées de la fenêtre. */
  survol: { barre: BarreGantt; ligne: LigneGantt; x: number; y: number } | null = null;

  private taches: TacheGantt[] = [];
  private abonnement?: Subscription;

  constructor(private directionService: DirectionService) {
  }

  /** Rechargé à chaque changement de projet. */
  ngOnChanges(): void {
    this.abonnement?.unsubscribe();
    this.chargement = true;
    this.erreur = false;
    this.survol = null;
    this.abonnement = this.directionService.ganttProjet(this.projet.id).subscribe({
      next: taches => {
        this.taches = taches;
        this.echelle = this.echelleAdaptee();
        this.construire();
        this.chargement = false;
      },
      error: () => {
        this.chargement = false;
        this.erreur = true;
      }
    });
  }

  /**
   * Une séance vient d'être modifiée depuis sa fiche : les barres sont
   * recalculées sur place, sans indicateur de chargement ni changement
   * d'échelle, pour ne pas faire sauter le diagramme sous les yeux.
   */
  recharger(): void {
    this.abonnement?.unsubscribe();
    this.abonnement = this.directionService.ganttProjet(this.projet.id).subscribe({
      next: taches => {
        this.taches = taches;
        this.construire();
      },
      // L'ancien diagramme reste affiché : mieux qu'un écran d'erreur pour
      // une actualisation manquée.
      error: () => undefined
    });
  }

  /**
   * Clic sur une barre : la fiche de la séance, dans le même menu que les
   * plannings de l'espace de travail (app-event-menu), ouvert à côté du clic.
   */
  ouvrirSeance(barre: BarreGantt, event: MouseEvent): void {
    this.survol = null;
    this.eventMenu.ouvrirConsultation(barre.realisation.id, event);
  }

  choisirEchelle(echelle: EchelleGantt): void {
    this.echelle = echelle;
    this.construire();
  }

  // ---------------------------------------------------------------- construction

  /** Échelle qui montre toute la période sans trop défiler. */
  private echelleAdaptee(): EchelleGantt {
    const bornes = this.bornes();
    if (!bornes) {
      return 'semaine';
    }
    const jours = (bornes.fin - bornes.debut) / JOUR;
    return jours <= 31 ? 'jour' : jours <= 150 ? 'semaine' : 'mois';
  }

  /** Période couverte : séances, dates prévues, et aujourd'hui. Null sans rien à dessiner. */
  private bornes(): { debut: number; fin: number } | null {
    const maintenant = Date.now();
    let debut = Infinity;
    let fin = -Infinity;
    for (const tache of this.taches) {
      for (const r of tache.realisations ?? []) {
        const d = new Date(r.debut).getTime();
        if (isNaN(d)) continue;
        debut = Math.min(debut, d);
        fin = Math.max(fin, this.finDe(r, d));
      }
      for (const repere of [this.demarrageDe(tache), this.echeanceDe(tache)]) {
        if (repere === null) continue;
        debut = Math.min(debut, repere);
        fin = Math.max(fin, repere);
      }
    }
    if (debut === Infinity) {
      return null;
    }
    // Un jour de marge de chaque côté, calé sur minuit : les graduations
    // tombent juste et aucune barre ne colle au bord.
    return {
      debut: this.minuit(Math.min(debut, maintenant)) - JOUR,
      fin: this.minuit(Math.max(fin, maintenant)) + 2 * JOUR
    };
  }

  private construire(): void {
    const bornes = this.bornes();
    this.sansPlanning = this.taches.filter(t => !this.estDessinee(t));
    if (!bornes) {
      this.lignes = [];
      this.fleches = [];
      this.largeur = 0;
      return;
    }
    const maintenant = Date.now();
    const pixels = PIXELS_PAR_JOUR[this.echelle];
    const x = (instant: number) => (instant - bornes.debut) / JOUR * pixels;

    this.largeur = x(bornes.fin);
    this.aujourdhui = x(maintenant);
    this.graduer(bornes, x);

    this.lignes = this.taches
      .filter(t => this.estDessinee(t))
      .map(tache => {
        const avancement = Math.max(0, Math.min(100, tache.currentCompletionPercent ?? 0));
        const barres = (tache.realisations ?? [])
          .map(r => this.barre(r, x, maintenant))
          .filter((b): b is BarreGantt => b !== null);
        const demarrage = this.demarrageDe(tache);
        const echeance = this.echeanceDe(tache);
        const debutSeances = barres.length ? Math.min(...barres.map(b => b.debut)) : null;
        const finSeances = barres.length ? Math.max(...barres.map(b => b.fin)) : null;
        // La deadline fait foi ; sans elle, la fin de la dernière séance en tient lieu.
        const finPrevue = echeance ?? finSeances;
        const enRetard = avancement < 100 && finPrevue !== null && finPrevue < maintenant;
        const reperes = [debutSeances, demarrage, echeance].filter((r): r is number => r !== null);
        return {
          tache,
          avancement,
          barres,
          etendue: debutSeances !== null && finSeances !== null
            ? {gauche: x(debutSeances), largeur: Math.max(2, x(finSeances) - x(debutSeances))}
            : null,
          prevu: demarrage !== null && echeance !== null && echeance > demarrage
            ? {gauche: x(demarrage), largeur: x(echeance) - x(demarrage)}
            : null,
          echeance: echeance !== null
            ? {gauche: x(echeance), date: echeance - JOUR, depassee: enRetard}
            : null,
          retard: enRetard && finPrevue !== null
            ? {gauche: x(finPrevue), largeur: x(maintenant) - x(finPrevue), jours: Math.floor((maintenant - finPrevue) / JOUR)}
            : null,
          finEtiquette: Math.max(
            ...barres.map(b => b.gauche + b.largeur),
            ...reperes.map(r => x(r)),
            // Le losange de la deadline déborde de sa position.
            echeance !== null ? x(echeance) + 6 : 0,
            enRetard ? x(maintenant) : 0),
          debut: Math.min(...reperes)
        };
      })
      // Dans l'ordre où le travail a commencé : le diagramme se lit en escalier.
      .sort((a, b) => a.debut - b.debut);

    // Deux rangées d'en-tête (mois, puis jours ou semaines) dépassent la
    // hauteur minimale d'une ligne ; une seule tient dedans.
    this.hautEntete = this.graduations.length ? 2 * 22 + 1 : RANG;
    this.flecher();
  }

  /**
   * Une flèche par dépendance dont les deux tâches sont dessinées : de la fin
   * de la dernière séance de la source au début de la première séance de la
   * destination. Une tâche d'un autre projet, ou sans planning, n'a pas de
   * ligne : sa dépendance n'est pas tracée.
   *
   * Tracé en coudes, en sortant par le dessous (ou le dessus) de la barre :
   * le pourcentage affiché à sa droite reste lisible.
   */
  private flecher(): void {
    const rangs = new Map<unknown, number>();
    this.lignes.forEach((ligne, rang) => rangs.set(ligne.tache.id, rang));

    this.fleches = [];
    this.lignes.forEach((source, i) => {
      for (const dependance of source.tache.dependances ?? []) {
        const j = rangs.get(dependance.destinationId);
        if (j === undefined || j === i || !source.etendue) {
          continue;
        }
        const destination = this.lignes[j];
        if (!destination.etendue) {
          continue;
        }
        const versLeBas = j > i;
        const x1 = source.etendue.gauche + source.etendue.largeur - 3;
        const y1 = i * RANG + (versLeBas ? BARRE_BAS : BARRE_HAUT);
        // Passage entre deux lignes, juste sous (ou sur) celle de la source.
        const couloir = (versLeBas ? i + 1 : i) * RANG - 0.5;
        const x2 = destination.etendue.gauche;
        const y2 = j * RANG + BARRE_MILIEU;
        this.fleches.push({
          chemin: `M${x1} ${y1} V${couloir} H${x2 - 10} V${y2} H${x2 - 2}`,
          titre: `${source.tache.issueKey} ${dependance.libelle} ${destination.tache.issueKey}`
        });
      }
    });
  }

  private barre(r: RealisationTache, x: (instant: number) => number, maintenant: number): BarreGantt | null {
    const debut = new Date(r.debut).getTime();
    if (isNaN(debut)) {
      return null;
    }
    const fin = this.finDe(r, debut);
    const aspect = this.aspect(r, debut, fin, maintenant);
    return {
      realisation: r,
      debut,
      fin,
      gauche: x(debut),
      // Une séance d'une heure reste visible à l'échelle du mois.
      largeur: Math.max(6, x(fin) - x(debut)),
      aspect,
      libelle: LEGENDE.find(l => l.aspect === aspect)!.libelle
    };
  }

  /** Tâche qui a sa ligne : au moins une séance, ou une date prévue à montrer. */
  private estDessinee(tache: TacheGantt): boolean {
    return !!(tache.realisations ?? []).length
      || this.demarrageDe(tache) !== null
      || this.echeanceDe(tache) !== null;
  }

  /** Date de démarrage : le début du jour saisi. */
  private demarrageDe(tache: TacheGantt): number | null {
    const instant = this.instant(tache.dateDemarrage);
    return instant === null ? null : this.minuit(instant);
  }

  /** Deadline : la fin du jour saisi, la tâche a toute la journée pour finir. */
  private echeanceDe(tache: TacheGantt): number | null {
    const instant = this.instant(tache.deadline);
    return instant === null ? null : this.minuit(instant) + JOUR;
  }

  private instant(date?: string | null): number | null {
    const instant = date ? new Date(date).getTime() : NaN;
    return isNaN(instant) ? null : instant;
  }

  /** Fin de la séance ; sans fin renseignée, une heure après le début. */
  private finDe(r: RealisationTache, debut: number): number {
    const fin = r.fin ? new Date(r.fin).getTime() : NaN;
    return isNaN(fin) || fin <= debut ? debut + HEURE : fin;
  }

  private aspect(r: RealisationTache, debut: number, fin: number, maintenant: number): AspectBarre {
    switch (r.etat) {
      case 'COMPLETED': return 'realisee';
      case 'BLOCKED': return 'bloquee';
      case 'POSTPONED': return 'reportee';
      case 'EXTENDED': return 'prolongee';
      case 'IN_PROGRESS': return 'en-cours';
    }
    // Exécution non déclarée : la date décide.
    if (debut > maintenant) {
      return 'planifiee';
    }
    return fin <= maintenant ? 'realisee' : 'en-cours';
  }

  /** Deux rangées d'en-tête : les mois, puis les jours ou les semaines. */
  private graduer(bornes: { debut: number; fin: number }, x: (instant: number) => number): void {
    this.mois = [];
    for (let d = new Date(bornes.debut); d.getTime() < bornes.fin;) {
      const suivant = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const fin = Math.min(suivant.getTime(), bornes.fin);
      this.mois.push({
        libelle: d.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}),
        gauche: x(d.getTime()),
        largeur: x(fin) - x(d.getTime())
      });
      d = suivant;
    }

    this.graduations = [];
    if (this.echelle === 'mois') {
      return;
    }
    for (let d = new Date(bornes.debut); d.getTime() < bornes.fin; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      const lundi = d.getDay() === 1;
      if (this.echelle === 'semaine' && !lundi) {
        continue;
      }
      const pas = this.echelle === 'jour' ? 1 : 7;
      const fin = Math.min(new Date(d.getFullYear(), d.getMonth(), d.getDate() + pas).getTime(), bornes.fin);
      this.graduations.push({
        libelle: String(d.getDate()),
        gauche: x(d.getTime()),
        largeur: x(fin) - x(d.getTime())
      });
    }
  }

  private minuit(instant: number): number {
    const d = new Date(instant);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  // ---------------------------------------------------------------- survol

  survoler(barre: BarreGantt, ligne: LigneGantt, event: MouseEvent): void {
    this.survol = {barre, ligne, x: event.clientX, y: event.clientY};
  }

  quitter(): void {
    this.survol = null;
  }

  // ---------------------------------------------------------------- affichage

  /** Adresse de la tâche dans son espace de travail. */
  lienTache(tache: TacheGantt): string[] | null {
    return this.projet.prefixeDepartement && tache.issueKey
      ? ['/working', this.projet.prefixeDepartement, 'issue', this.projet.cle, 'subtask', tache.issueKey as string]
      : null;
  }

  /** Durée d'une séance en « 4 h 30 » ou « 3 j ». */
  duree(barre: BarreGantt): string {
    const minutes = Math.round((barre.fin - barre.debut) / 60000);
    if (minutes >= 24 * 60) {
      return `${Math.round(minutes / (24 * 60))} j`;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) {
      return `${m} min`;
    }
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  }

  nomDe(r: RealisationTache): string {
    const u = r.intervenant;
    const nom = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
    return nom || (u?.username as string) || '';
  }

  parId(_: number, ligne: LigneGantt): unknown {
    return ligne.tache.id;
  }
}
