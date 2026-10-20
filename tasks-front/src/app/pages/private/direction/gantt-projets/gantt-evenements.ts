import {EventApp, User} from '../../../../type/issue';
import {HEURE, instantDe, minuit, plusJours} from './gantt-dates.util';
import {FenetreGantt} from './gantt-fenetre';
import {ActiviteTache, PartieGantt, PlanGantt, Seance, Serie} from './gantt-projets.model';

/*
 * Couche « activité » du Gantt de direction : des événements de planning
 * (`PlanningEvent`, tels que `searchEvents` les rend) vers ce que la page en
 * dessine. Tout se fait ici, dans le navigateur : le serveur ne prépare rien.
 *
 * Cette couche ignore les projets et les regroupements : on lui dit seulement
 * sur quelle ligne se dessine chaque tâche, et elle range son résultat par ligne. On
 * peut donc changer d'événements (une personne, une autre recherche) sans
 * rien reconstruire d'autre.
 */

const TYPE_EVENEMENT_CHAMP = 'CUSTOM_FIELD';

/** Écart minimal entre les centres de deux pastilles pour qu'elles ne se recouvrent pas. */
const LARGEUR_PASTILLE = 36;

const SANS_ACTIVITE: ActiviteTache = {parties: [], plans: [], voies: 0, personnes: []};

/** Activité des lignes du diagramme sur une période, par clé de ligne. */
export class ActivitesGantt {

  static readonly AUCUNE = new ActivitesGantt(new Map());

  constructor(private readonly parLigne: Map<string, ActiviteTache>) {
  }

  /** Activité d'une ligne ; vide si ses tâches n'ont aucun événement sur la période. */
  de(cle: string): ActiviteTache {
    return this.parLigne.get(cle) ?? SANS_ACTIVITE;
  }

  /** Personnes distinctes au travail sur un ensemble de lignes : celles d'un projet, par exemple. */
  personnes(cles: string[]): User[] {
    const personnes = new Map<string, User>();
    for (const cle of cles) {
      this.de(cle).personnes.forEach(personne => personnes.set(personne.id, personne));
    }
    return [...personnes.values()];
  }
}

/**
 * Place des événements de planning sur l'axe.
 *
 * Une séance passée est du réalisé, une séance à venir du planifié : c'est la
 * date qui décide, à `maintenant`. Les événements `CUSTOM_FIELD` sont écartés,
 * comme dans les plannings : ce sont des dates de champ, pas du travail.
 *
 * @param ligneDe clé de la ligne où se dessine une tâche — la tâche elle-même ou
 *                son groupe ; un événement dont la tâche n'a pas de ligne est ignoré
 */
export function placerEvenements(evenements: EventApp[], fenetre: FenetreGantt, maintenant: number,
                                 ligneDe: (tacheId: number) => string | undefined): ActivitesGantt {
  const seances = new Map<string, Seance[]>();
  for (const evenement of evenements) {
    const seance = versSeance(evenement, maintenant);
    const cle = evenement.issue?.id == null ? undefined : ligneDe(evenement.issue.id);
    if (seance && cle !== undefined) {
      seances.set(cle, [...(seances.get(cle) ?? []), seance]);
    }
  }
  const activites = new Map<string, ActiviteTache>();
  seances.forEach((lot, cle) => activites.set(cle, activite(lot, fenetre)));
  return new ActivitesGantt(activites);
}

function activite(seances: Seance[], fenetre: FenetreGantt): ActiviteTache {
  const plans = planifie(seances, fenetre);
  const personnes = new Map<string, User>();
  for (const seance of seances) {
    const personne = seance.evenement.user;
    if (personne?.id) {
      personnes.set(personne.id, personne);
    }
  }
  return {
    parties: realise(seances, fenetre),
    plans,
    voies: new Set(plans.map(plan => plan.voie)).size,
    personnes: [...personnes.values()]
  };
}

// ------------------------------------------------------------------ séances

/** Situe un événement ; null pour une date de champ personnalisé ou un événement sans début. */
function versSeance(evenement: EventApp, maintenant: number): Seance | null {
  const debut = instantDe(evenement.start);
  if (debut === null || evenement.eventType?.name?.toUpperCase() === TYPE_EVENEMENT_CHAMP) {
    return null;
  }
  let fin = instantDe(evenement.end) ?? debut + HEURE;
  if (fin <= debut) {
    fin = debut + HEURE;
  }
  if (evenement.allDay) {
    fin = Math.max(fin, plusJours(minuit(debut), 1));
  }
  return {evenement, debut, fin, finReelle: finReelle(evenement.executionStatus, debut, fin, maintenant)};
}

/**
 * Ce qui a réellement été fait d'une séance. Sans exécution déclarée, la date
 * décide : passée, la séance compte comme faite — c'est déjà la règle du temps
 * passé et de l'avancement dans toute l'application.
 */
function finReelle(etat: string | undefined, debut: number, fin: number, maintenant: number): number | null {
  switch (etat) {
    case 'BLOCKED':
    case 'POSTPONED':
      return null;
    case 'COMPLETED':
    case 'EXTENDED':
      return fin;
  }
  return debut < maintenant ? Math.min(fin, maintenant) : null;
}

interface Intervalle {
  debut: number;
  fin: number;
}

/** Le fait d'une séance : de son début à la fin de ce qui a été réellement fait. */
function fait(seance: Seance): Intervalle | null {
  return seance.finReelle === null ? null : {debut: seance.debut, fin: seance.finReelle};
}

/**
 * Ce qui reste à faire d'une séance : toute la séance si rien n'est fait, sinon
 * les jours qui suivent le dernier jour travaillé. Une séance terminée ne
 * laisse rien : passée, la planification est devenue du réalisé.
 */
function aFaire(seance: Seance): Intervalle | null {
  if (seance.finReelle === null) {
    return {debut: seance.debut, fin: seance.fin};
  }
  const lendemain = plusJours(minuit(seance.finReelle - 1), 1);
  return lendemain < seance.fin ? {debut: lendemain, fin: seance.fin} : null;
}

/**
 * Regroupe des séances en suites de jours travaillés, au grain de l'axe : à
 * l'échelle de la semaine, deux séances de la même semaine font une seule
 * suite.
 *
 * @param intervalle     la part de chaque séance à retenir : le fait, ou ce qui reste à faire
 * @param memesPersonnes coupe aussi quand les personnes au travail changent
 */
function series(seances: Seance[], intervalle: (s: Seance) => Intervalle | null, fenetre: FenetreGantt, memesPersonnes: boolean): Serie[] {
  const seaux = new Map<number, Serie>();
  for (const seance of seances) {
    const retenu = intervalle(seance);
    if (!retenu) {
      continue;
    }
    const dernier = minuit(Math.min(retenu.fin, fenetre.fin) - 1);
    for (let jour = minuit(Math.max(retenu.debut, fenetre.debut)); jour <= dernier; jour = plusJours(jour, 1)) {
      const depart = fenetre.seau(jour);
      const seau = seaux.get(depart) ?? {debut: jour, fin: jour, personnes: [], seances: []};
      seau.debut = Math.min(seau.debut, jour);
      seau.fin = Math.max(seau.fin, plusJours(jour, 1));
      ajouter(seau, seance);
      seaux.set(depart, seau);
    }
  }
  const resultat: { serie: Serie; seau: number }[] = [];
  for (const depart of [...seaux.keys()].sort((a, b) => a - b)) {
    const seau = seaux.get(depart)!;
    const precedente = resultat[resultat.length - 1];
    if (precedente && fenetre.seSuivent(precedente.seau, depart)
      && (!memesPersonnes || signature(precedente.serie) === signature(seau))) {
      precedente.serie.fin = seau.fin;
      precedente.seau = depart;
      seau.seances.forEach(seance => ajouter(precedente.serie, seance));
    } else {
      resultat.push({serie: seau, seau: depart});
    }
  }
  return resultat.map(r => r.serie);
}

function ajouter(serie: Serie, seance: Seance): void {
  const personne = seance.evenement.user;
  if (personne && !serie.personnes.some(p => p.id === personne.id)) {
    serie.personnes.push(personne);
  }
  if (!serie.seances.includes(seance)) {
    serie.seances.push(seance);
  }
}

function signature(serie: Serie): string {
  return serie.personnes.map(p => p.id).sort().join('|');
}

// ------------------------------------------------------------------ réalisé, planifié

/** Réalisé : mêmes personnes d'un bout à l'autre d'une partie. */
function realise(seances: Seance[], fenetre: FenetreGantt): PartieGantt[] {
  const parties: PartieGantt[] = [];
  let libre = -Infinity;
  for (const serie of series(seances, fait, fenetre, true)) {
    const segment = fenetre.segment(serie.debut, serie.fin);
    if (!segment) {
      continue;
    }
    const centre = segment.gauche + segment.largeur / 2;
    // Une seule personne : pas de pastille, l'infobulle la montre. Deux pastilles
    // ne se recouvrent pas : la seconde cède, l'infobulle garde le compte.
    const pastille = serie.personnes.length > 1 && centre >= libre;
    if (pastille) {
      libre = centre + LARGEUR_PASTILLE;
    }
    parties.push({...segment, serie, pastille, centre});
  }
  return parties;
}

/**
 * Planifié : ce qui reste à faire, une voie par personne dans l'ordre de leur
 * première séance. Le passé n'y figure pas : il est dans le réalisé.
 */
function planifie(seances: Seance[], fenetre: FenetreGantt): PlanGantt[] {
  const parPersonne = new Map<string, Seance[]>();
  for (const seance of [...seances].sort((a, b) => a.debut - b.debut)) {
    const id = seance.evenement.user?.id ?? '';
    parPersonne.set(id, [...(parPersonne.get(id) ?? []), seance]);
  }
  const plans: PlanGantt[] = [];
  let voie = 0;
  for (const lot of parPersonne.values()) {
    const personne = lot[0].evenement.user ?? new User();
    const visibles: PlanGantt[] = [];
    for (const serie of series(lot, aFaire, fenetre, false)) {
      const segment = fenetre.segment(serie.debut, serie.fin);
      if (segment) {
        visibles.push({...segment, serie, personne, voie});
      }
    }
    if (visibles.length) {
      plans.push(...visibles);
      voie++;
    }
  }
  return plans;
}
