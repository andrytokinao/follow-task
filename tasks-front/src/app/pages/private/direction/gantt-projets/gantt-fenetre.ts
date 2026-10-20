import {estWeekend, JOUR, lundi, minuit, numeroSemaine, plusJours, plusMois, premierDuMois} from './gantt-dates.util';

/** Finesse de l'axe du temps. */
export type EchelleGantt = 'jour' | 'semaine' | 'mois';

/**
 * Par échelle : largeur d'un jour, étendue de la fenêtre, recul par rapport à
 * aujourd'hui à l'ouverture, et pas de navigation. Tout est multiple de 7 : la
 * fenêtre commence toujours un lundi. Ajouter une échelle, c'est ajouter une
 * entrée ici et son grain dans {@link FenetreGantt.seau}.
 */
const ECHELLES: Record<EchelleGantt, { pixels: number; jours: number; recul: number; pas: number }> = {
  jour: {pixels: 30, jours: 42, recul: 14, pas: 14},
  semaine: {pixels: 10, jours: 126, recul: 42, pas: 42},
  mois: {pixels: 3.5, jours: 364, recul: 119, pas: 119},
};

/** Morceau d'axe visible ; `coupe…` quand il déborde de la fenêtre. */
export interface Segment {
  gauche: number;
  largeur: number;
  coupeGauche: boolean;
  coupeDroite: boolean;
}

export interface Graduation {
  libelle: string;
  detail?: string;
  gauche: number;
  largeur: number;
  aujourdhui?: boolean;
}

/** En-tête de l'axe et son fond. */
export interface AxeGantt {
  groupes: Graduation[];
  graduations: Graduation[];
  weekends: { gauche: number; largeur: number }[];
}

/**
 * Période affichée et son échelle : seule à savoir convertir un instant en
 * position. Immuable — naviguer rend une nouvelle fenêtre.
 */
export class FenetreGantt {

  readonly fin: number;
  readonly largeur: number;

  private constructor(readonly echelle: EchelleGantt, readonly debut: number) {
    this.fin = plusJours(debut, ECHELLES[echelle].jours);
    this.largeur = ECHELLES[echelle].jours * ECHELLES[echelle].pixels;
  }

  /** Fenêtre de l'échelle demandée, autour de l'instant donné. */
  static autour(echelle: EchelleGantt, instant: number): FenetreGantt {
    return new FenetreGantt(echelle, plusJours(lundi(instant), -ECHELLES[echelle].recul));
  }

  /** Recule (-1) ou avance (1) d'un pas. */
  decaler(sens: number): FenetreGantt {
    return new FenetreGantt(this.echelle, plusJours(this.debut, sens * ECHELLES[this.echelle].pas));
  }

  contient(instant: number): boolean {
    return instant >= this.debut && instant < this.fin;
  }

  x(instant: number): number {
    return (instant - this.debut) / JOUR * ECHELLES[this.echelle].pixels;
  }

  /** Jour sous une position de l'axe : l'inverse de {@link x}, au jour près. */
  jourA(x: number): number {
    return plusJours(this.debut, Math.floor(x / ECHELLES[this.echelle].pixels));
  }

  /** Partie visible d'un intervalle ; null s'il est tout entier hors de la fenêtre. */
  segment(debut: number, fin: number): Segment | null {
    if (fin <= this.debut || debut >= this.fin) {
      return null;
    }
    const gauche = this.x(Math.max(debut, this.debut));
    return {
      gauche,
      // Une journée reste visible à l'échelle du mois.
      largeur: Math.max(4, this.x(Math.min(fin, this.fin)) - gauche),
      coupeGauche: debut < this.debut,
      coupeDroite: fin > this.fin
    };
  }

  /** Début de la case de l'axe (jour, semaine ou mois) qui contient ce jour. */
  seau(jour: number): number {
    switch (this.echelle) {
      case 'jour': return jour;
      case 'semaine': return lundi(jour);
      case 'mois': return premierDuMois(jour);
    }
  }

  /** Fin (exclue) de la case qui commence à `seau`. */
  finDeCase(seau: number): number {
    switch (this.echelle) {
      case 'jour': return plusJours(seau, 1);
      case 'semaine': return plusJours(seau, 7);
      case 'mois': return plusMois(seau, 1);
    }
  }

  /** « lun. 13 oct. », « S42 · 12 oct. – 18 oct. » ou « octobre 2026 ». */
  libelleCase(seau: number): string {
    const date = (d: number, options: Intl.DateTimeFormatOptions) => new Date(d).toLocaleDateString('fr-FR', options);
    switch (this.echelle) {
      case 'jour': return date(seau, {weekday: 'short', day: 'numeric', month: 'short'});
      case 'semaine':
        return `S${numeroSemaine(seau)} · ${date(seau, {day: 'numeric', month: 'short'})} – `
          + date(plusJours(seau, 6), {day: 'numeric', month: 'short'});
      case 'mois': return date(seau, {month: 'long', year: 'numeric'});
    }
  }

  /** Case de l'axe à l'écran, rognée à la fenêtre. */
  segmentDeCase(seau: number): Segment | null {
    return this.segment(seau, this.finDeCase(seau));
  }

  /** Deux cases se suivent-elles ? Au jour près, un week-end entre les deux ne compte pas. */
  seSuivent(seau: number, suivant: number): boolean {
    switch (this.echelle) {
      case 'mois': return plusMois(seau, 1) === suivant;
      case 'semaine': return plusJours(seau, 7) === suivant;
      case 'jour': {
        let prochain = plusJours(seau, 1);
        while (prochain < suivant && estWeekend(prochain)) {
          prochain = plusJours(prochain, 1);
        }
        return prochain === suivant;
      }
    }
  }

  /** En-tête sur deux rangées : semaines et jours, mois et semaines, ou années et mois. */
  axe(maintenant: number): AxeGantt {
    const pixels = ECHELLES[this.echelle].pixels;
    const aujourdhui = minuit(maintenant);
    const semaines = this.semaines(aujourdhui);
    const weekends = semaines.map(s => ({gauche: s.gauche + 5 * pixels, largeur: 2 * pixels}));
    const libelle = (options: Intl.DateTimeFormatOptions) =>
      (d: number) => new Date(d).toLocaleDateString('fr-FR', options);

    switch (this.echelle) {
      case 'jour':
        return {groupes: semaines, graduations: this.jours(aujourdhui), weekends};
      case 'semaine':
        return {groupes: this.parMois(1, libelle({month: 'long', year: 'numeric'})), graduations: semaines, weekends};
      case 'mois':
        return {
          groupes: this.parMois(12, libelle({year: 'numeric'})),
          graduations: this.parMois(1, libelle({month: 'short'})),
          // Trop fins pour être lus : à cette échelle, pas de week-ends.
          weekends: []
        };
    }
  }

  private jours(aujourdhui: number): Graduation[] {
    const jours: Graduation[] = [];
    for (let d = this.debut; d < this.fin; d = plusJours(d, 1)) {
      jours.push({
        libelle: String(new Date(d).getDate()),
        gauche: this.x(d),
        largeur: this.x(plusJours(d, 1)) - this.x(d),
        aujourdhui: d === aujourdhui
      });
    }
    return jours;
  }

  private semaines(aujourdhui: number): Graduation[] {
    const jour = (d: number) => new Date(d).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
    const semaines: Graduation[] = [];
    for (let d = this.debut; d < this.fin; d = plusJours(d, 7)) {
      semaines.push({
        libelle: `S${numeroSemaine(d)}`,
        detail: `${jour(d)} – ${jour(plusJours(d, 6))}`,
        gauche: this.x(d),
        largeur: this.x(plusJours(d, 7)) - this.x(d),
        aujourdhui: lundi(aujourdhui) === d
      });
    }
    return semaines;
  }

  /** Du premier de chaque mois (ou de chaque année, `pas` = 12) au suivant, rogné à la fenêtre. */
  private parMois(pas: number, libelle: (d: number) => string): Graduation[] {
    const graduations: Graduation[] = [];
    const premier = new Date(this.debut);
    let d = new Date(premier.getFullYear(), pas === 12 ? 0 : premier.getMonth(), 1).getTime();
    while (d < this.fin) {
      const suivant = plusMois(d, pas);
      const visible = Math.max(d, this.debut);
      graduations.push({
        libelle: libelle(visible),
        gauche: this.x(visible),
        largeur: this.x(Math.min(suivant, this.fin)) - this.x(visible)
      });
      d = suivant;
    }
    return graduations;
  }
}
