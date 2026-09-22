/**
 * Rechargement complet de la page, avec sa raison gardée pour la suite.
 *
 * Un rechargement efface la console : impossible, après coup, de savoir ce
 * qui l'a déclenché. La raison est donc notée en localStorage juste avant,
 * puis affichée dans la console au démarrage suivant, et effacée.
 *
 * Si la page se recharge sans laisser de trace, ce n'est pas l'application
 * qui l'a demandé : il faut chercher côté navigateur ou serveur.
 */
const CLE = 'trace-dernier-rechargement';

export interface TraceRechargement {
  raison: string;
  detail?: string;
  page: string;
  date: string;
}

export function recharger(raison: string, detail?: unknown): void {
  const trace: TraceRechargement = {
    raison,
    detail: detail == null ? undefined : String(detail),
    page: location.pathname + location.search,
    date: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CLE, JSON.stringify(trace));
  } catch {
    // Stockage indisponible (navigation privée, quota) : on recharge quand même.
  }
  document.location.reload();
}

/** À appeler au démarrage : affiche la raison du rechargement précédent. */
export function afficherDernierRechargement(): void {
  let brut: string | null = null;
  try {
    brut = localStorage.getItem(CLE);
    localStorage.removeItem(CLE);
  } catch {
    return;
  }
  if (!brut) {
    return;
  }
  try {
    const trace: TraceRechargement = JSON.parse(brut);
    console.warn(`[RECHARGEMENT] ${trace.raison} — page ${trace.page}, ${trace.date}`,
      trace.detail ?? '');
  } catch {
    // Trace illisible : rien à montrer.
  }
}
