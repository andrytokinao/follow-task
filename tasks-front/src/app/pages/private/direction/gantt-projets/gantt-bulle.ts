import {User} from '../../../../type/issue';
import {userDisplayName} from '../../../../type/issue-grouping.util';
import {minuit} from './gantt-dates.util';
import {Seance, Serie} from './gantt-projets.model';

/*
 * Contenu de l'infobulle du Gantt de direction. Sur une barre de réalisé ou de
 * planifié : l'essentiel de chaque séance, qui (photo), quoi (titre), quand
 * (heures et durée).
 */

/** Au-delà, l'infobulle déborderait de l'écran : le reste est seulement compté. */
const SEANCES_AFFICHEES = 6;

export interface SeanceBulle {
  personne: User | null;
  qui: string;
  /** Titre de la séance de planning. */
  quoi: string;
  /** « lun. 13 oct. 08:00 – 10:00 ». */
  quand: string;
  /** « 2 h », « 1 h 30 », « 45 min ». */
  duree: string;
}

export interface ContenuBulle {
  titre: string;
  sousTitre: string;
  seances: SeanceBulle[];
  /** Séances non détaillées, faute de place. */
  reste: number;
  aide: string;
}

/** Les séances d'une barre, dans l'ordre : le titre dit seulement la tâche. */
export function bulleDeSerie(titre: string, serie: Serie): ContenuBulle {
  const seances = [...serie.seances].sort((a, b) => a.debut - b.debut);
  return {
    titre,
    sousTitre: '',
    seances: seances.slice(0, SEANCES_AFFICHEES).map(seanceBulle),
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

/** « 2 h », « 1 h 30 », « 45 min ». */
export function duree(debut: number, fin: number): string {
  const minutes = Math.max(0, Math.round((fin - debut) / 60000));
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (!heures) {
    return `${reste} min`;
  }
  return reste ? `${heures} h ${String(reste).padStart(2, '0')}` : `${heures} h`;
}

function seanceBulle(seance: Seance): SeanceBulle {
  const e = seance.evenement;
  const heure = (t: number) => new Date(t).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
  const jour = new Date(seance.debut).toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric', month: 'short'});
  return {
    personne: e.user ?? null,
    qui: userDisplayName(e.user),
    quoi: e.title ?? '',
    quand: `${jour} ${heure(seance.debut)} – ${heure(seance.fin)}`,
    duree: duree(seance.debut, seance.fin)
  };
}
