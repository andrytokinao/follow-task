import {User} from '../../../../../type/issue';
import {userDisplayName} from '../../../../../type/issue-grouping.util';
import {duree} from '../gantt-bulle';
import {Seance, Serie} from '../gantt-projets.model';

/*
 * Détail des séances d'une barre du Gantt, pour le menu ouvert au clic :
 * tout ce que l'infobulle laisse de côté. Fonctions pures.
 */

/** Libellés de `ExecutionStatus`. */
const ETATS: Record<string, string> = {
  PENDING: 'Planifiée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Réalisée',
  BLOCKED: 'Bloquée',
  POSTPONED: 'Reportée',
  EXTENDED: 'Prolongée',
};

const LONGUEUR_DETAIL = 180;

export interface DetailSeance {
  id: number | string | null;
  personne: User | null;
  qui: string;
  quoi: string;
  /** « lun. 13 oct. 08:00 – 10:00 ». */
  quand: string;
  duree: string;
  etat: string;
  /** Code de l'état, pour sa couleur. */
  code: string;
  avancement: number | null;
  /** Description, en texte simple, abrégée. */
  detail: string;
}

/**
 * Les séances de la barre, dans l'ordre.
 * @param reel la barre est du réalisé : une séance passée sans exécution
 *             déclarée y est réputée faite
 */
export function detailsSeances(serie: Serie, reel: boolean): DetailSeance[] {
  return [...serie.seances].sort((a, b) => a.debut - b.debut).map(seance => detail(seance, reel));
}

function detail(seance: Seance, reel: boolean): DetailSeance {
  const e = seance.evenement;
  const heure = (t: number) => new Date(t).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
  const jour = new Date(seance.debut).toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric', month: 'short'});
  const declare = e.executionStatus && e.executionStatus !== 'PENDING';
  const code = reel && !declare ? 'COMPLETED' : e.executionStatus ?? 'PENDING';
  return {
    id: e.id ?? null,
    personne: e.user ?? null,
    qui: userDisplayName(e.user),
    quoi: e.title ?? '',
    quand: `${jour} ${heure(seance.debut)} – ${heure(seance.fin)}`,
    duree: duree(seance.debut, seance.fin),
    etat: ETATS[code] ?? '',
    code,
    avancement: e.completionPercentage ?? null,
    detail: texteBrut(e.description)
  };
}

/** Description d'une séance, saisie en texte riche : le texte seul, abrégé. */
function texteBrut(html: string | undefined): string {
  const texte = (html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return texte.length > LONGUEUR_DETAIL ? texte.slice(0, LONGUEUR_DETAIL) + '…' : texte;
}
