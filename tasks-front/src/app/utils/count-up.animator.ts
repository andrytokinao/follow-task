import { ChangeDetectorRef, NgZone } from '@angular/core';

export interface CountUpTarget {
  key: string;
  percent?: number | null;
  minutes?: number | null;
}

// Compteur animé partagé : à l'ouverture d'un panneau, chaque valeur
// (pourcentage d'avancement, durée passée) repart de 0 et monte jusqu'à sa
// valeur réelle.
//
// Une seule boucle requestAnimationFrame met à jour toutes les lignes, donc
// une seule détection de changements par frame quel que soit leur nombre.
export class CountUpAnimator {
  private percentByKey = new Map<string, number>();
  private minutesByKey = new Map<string, number>();
  /** Valeur finale visée par clé : fixer() peut la corriger en cours d'animation. */
  private cibles = new Map<string, {percent: number; minutes: number}>();

  // Incrémenté à chaque start()/reset() : invalide la boucle en cours si le
  // panneau est refermé puis rouvert pendant l'animation.
  private generation = 0;

  constructor(
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private durationMs = 600,
  ) {}

  percentFor(key: string): number {
    return this.percentByKey.get(key) ?? 0;
  }

  minutesFor(key: string): number {
    return this.minutesByKey.get(key) ?? 0;
  }

  // À appeler à la fermeture : remet tout à zéro pour que l'animation
  // rejoue intégralement à la prochaine ouverture.
  reset(): void {
    this.generation++;
    this.percentByKey.clear();
    this.minutesByKey.clear();
    this.cibles.clear();
  }

  /**
   * Met à jour des valeurs déjà affichées, sans les faire repartir de 0 : un
   * rafraîchissement en arrière-plan ne doit pas donner l'impression que tout
   * se recharge. Une animation en cours termine sur la nouvelle valeur.
   */
  fixer(targets: CountUpTarget[]): void {
    for (const target of targets) {
      const cible = {percent: target.percent ?? 0, minutes: target.minutes ?? 0};
      this.cibles.set(target.key, cible);
      this.percentByKey.set(target.key, cible.percent);
      this.minutesByKey.set(target.key, cible.minutes);
    }
    this.cdr.markForCheck();
  }

  start(targets: CountUpTarget[]): void {
    this.reset();
    this.animer(targets);
  }

  /**
   * Anime des valeurs arrivées après l'ouverture — par exemple le détail des
   * tâches d'un dossier chargé au dépliage — sans remettre à zéro celles qui
   * sont déjà affichées. Une nouvelle ouverture (start) ou une fermeture
   * (reset) interrompt aussi ces animations-là.
   */
  ajouter(targets: CountUpTarget[]): void {
    this.animer(targets);
  }

  private animer(targets: CountUpTarget[]): void {
    const generation = this.generation;

    const keys = targets.map(target => target.key);
    for (const target of targets) {
      this.cibles.set(target.key, {percent: target.percent ?? 0, minutes: target.minutes ?? 0});
      this.percentByKey.set(target.key, 0);
      this.minutesByKey.set(target.key, 0);
    }
    if (keys.length === 0) return;

    const startTime = performance.now();
    // Montée rapide puis stabilisation en douceur sur la valeur finale.
    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      if (generation !== this.generation) return; // panneau refermé entre-temps

      const progress = Math.min(1, (now - startTime) / this.durationMs);
      const eased = easeOutCubic(progress);

      for (const key of keys) {
        const cible = this.cibles.get(key);
        if (!cible) continue;
        this.percentByKey.set(key, Math.round(cible.percent * eased));
        this.minutesByKey.set(key, Math.round(cible.minutes * eased));
      }
      this.cdr.markForCheck();

      if (progress < 1) requestAnimationFrame(step);
    };

    // Dans la zone Angular : chaque frame déclenche ainsi un cycle de
    // détection qui repeint les valeurs.
    this.zone.run(() => requestAnimationFrame(step));
  }
}
