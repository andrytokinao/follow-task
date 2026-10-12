/*
 * Dates du Gantt de direction. Fonctions pures, en heure locale : le serveur
 * envoie ses dates sans fuseau.
 */

export const JOUR = 24 * 60 * 60 * 1000;
export const HEURE = 60 * 60 * 1000;

/**
 * Jour d'une date du serveur, à minuit. Le serveur envoie `yyyy-MM-ddTHH:mm`
 * ou `yyyy-MM-dd HH:mm:ss.S` (un `Timestamp` Java) selon le champ : on ne lit
 * que la date, à la main, ce que tous les navigateurs font pareil.
 */
export function jourDe(valeur: unknown): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valeur ?? ''));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : null;
}

/** Instant d'une séance (`yyyy-MM-ddTHH:mm:ss`) ; à défaut d'heure, son jour. */
export function instantDe(valeur: unknown): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(valeur ?? ''));
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : jourDe(valeur);
}

/** Format attendu par `EventSearchCriteriaInput` : heure locale, sans fuseau. */
export function versIso(instant: number): string {
  const d = new Date(instant);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

export function minuit(instant: number): number {
  const d = new Date(instant);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Par le calendrier, pas par 24 h : un changement d'heure ne décale rien. */
export function plusJours(instant: number, jours: number): number {
  const d = new Date(instant);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + jours, d.getHours(), d.getMinutes()).getTime();
}

export function plusMois(instant: number, mois: number): number {
  const d = new Date(instant);
  return new Date(d.getFullYear(), d.getMonth() + mois, 1).getTime();
}

export function lundi(instant: number): number {
  const jour = minuit(instant);
  return plusJours(jour, -((new Date(jour).getDay() + 6) % 7));
}

export function premierDuMois(instant: number): number {
  return plusMois(instant, 0);
}

export function estWeekend(jour: number): boolean {
  const n = new Date(jour).getDay();
  return n === 0 || n === 6;
}

/** Numéro de semaine ISO : celle qui contient le jeudi. */
export function numeroSemaine(jour: number): number {
  const jeudi = new Date(plusJours(lundi(jour), 3));
  const premiere = lundi(new Date(jeudi.getFullYear(), 0, 4).getTime());
  return 1 + Math.round((jeudi.getTime() - premiere) / (7 * JOUR));
}
