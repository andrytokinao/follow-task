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
  }

  start(targets: CountUpTarget[]): void {
    this.reset();
    const generation = this.generation;

    // Cibles figées au moment de l'ouverture.
    const frozen = targets.map(target => ({
      key: target.key,
      percent: target.percent ?? 0,
      minutes: target.minutes ?? 0,
    }));

    for (const target of frozen) {
      this.percentByKey.set(target.key, 0);
      this.minutesByKey.set(target.key, 0);
    }
    if (frozen.length === 0) return;

    const startTime = performance.now();
    // Montée rapide puis stabilisation en douceur sur la valeur finale.
    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      if (generation !== this.generation) return; // panneau refermé entre-temps

      const progress = Math.min(1, (now - startTime) / this.durationMs);
      const eased = easeOutCubic(progress);

      for (const target of frozen) {
        this.percentByKey.set(target.key, Math.round(target.percent * eased));
        this.minutesByKey.set(target.key, Math.round(target.minutes * eased));
      }
      this.cdr.markForCheck();

      if (progress < 1) requestAnimationFrame(step);
    };

    // Dans la zone Angular : chaque frame déclenche ainsi un cycle de
    // détection qui repeint les valeurs.
    this.zone.run(() => requestAnimationFrame(step));
  }
}
