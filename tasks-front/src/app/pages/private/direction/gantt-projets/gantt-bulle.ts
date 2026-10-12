import {userDisplayName} from '../../../../type/issue-grouping.util';
import {minuit} from './gantt-dates.util';
import {Seance, Serie} from './gantt-projets.model';

/* Contenu de l'infobulle du Gantt de direction : ce qui a été fait, ou prévu, séance par séance. */

/** Libellés de `ExecutionStatus`. */
const ETATS: Record<string, string> = {
  PENDING: 'Planifiée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Réalisée',
  BLOCKED: 'Bloquée',
  POSTPONED: 'Reportée',
  EXTENDED: 'Prolongée',
};

/** Au-delà, l'infobulle déborderait de l'écran : le reste est seulement compté. */
const SEANCES_AFFICHEES = 6;
const LONGUEUR_DETAIL = 140;

export interface SeanceBulle {
  qui: string;
  quand: string;
  quoi: string;
  detail: string;
  etat: string;
  avancement: number | null;
}

export interface ContenuBulle {
  titre: string;
  sousTitre: string;
  seances: SeanceBulle[];
  /** Séances non détaillées, faute de place. */
  reste: number;
  aide: string;
}

/**
 * @param reel la série est du réalisé : une séance passée sans exécution
 *             déclarée y est réputée faite
 */
export function bulleDeSerie(titre: string, sousTitre: string, serie: Serie, reel: boolean): ContenuBulle {
  const seances = [...serie.seances].sort((a, b) => a.debut - b.debut);
  return {
    titre,
    sousTitre,
    seances: seances.slice(0, SEANCES_AFFICHEES).map(seance => seanceBulle(seance, reel)),
    reste: Math.max(0, seances.length - SEANCES_AFFICHEES),
    aide: seances.length === 1 ? 'Cliquer pour ouvrir la séance' : ''
  };
}

export function bulleSimple(titre: string, sousTitre: string): ContenuBulle {
  return {titre, sousTitre, seances: [], reste: 0, aide: ''};
}

/** « 12 oct. » ou « 12 oct. → 16 oct. ». */
export function periode(serie: Serie): string {
  const jour = (t: number) => new Date(t).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
  const dernier = serie.fin - 1;
  return minuit(dernier) === serie.debut ? jour(serie.debut) : `${jour(serie.debut)} → ${jour(dernier)}`;
}

function seanceBulle(seance: Seance, reel: boolean): SeanceBulle {
  const e = seance.evenement;
  const heure = (t: number) => new Date(t).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
  const jour = new Date(seance.debut).toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric', month: 'short'});
  const declare = e.executionStatus && e.executionStatus !== 'PENDING';
  return {
    qui: userDisplayName(e.user),
    quand: `${jour} ${heure(seance.debut)} – ${heure(seance.fin)}`,
    quoi: e.title ?? '',
    detail: texteBrut(e.description),
    etat: ETATS[reel && !declare ? 'COMPLETED' : e.executionStatus ?? 'PENDING'] ?? '',
    avancement: e.completionPercentage ?? null
  };
}

/** Description d'une séance, saisie en texte riche : le texte seul, abrégé. */
function texteBrut(html: string | undefined): string {
  const texte = (html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return texte.length > LONGUEUR_DETAIL ? texte.slice(0, LONGUEUR_DETAIL) + '…' : texte;
}
