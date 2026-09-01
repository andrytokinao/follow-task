import {Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';

/**
 * Compose le titre de l'onglet du navigateur.
 *
 * Un seul endroit décide du nom de l'application, du séparateur et de la
 * troncature : les pages n'ont plus qu'à fournir leur contexte, et l'ensemble
 * reste cohérent d'un écran à l'autre.
 */
@Injectable({providedIn: 'root'})
export class PageTitleService {

  /** Nom de marque, toujours placé en fin de titre. */
  static readonly APP_NAME = 'Paikady';

  /** Séparateur visuel entre les segments. */
  private static readonly SEPARATOR = ' · ';

  /**
   * Un onglet affiche rarement plus d'une trentaine de caractères. On coupe
   * donc les segments trop longs (un résumé d'issue, typiquement) plutôt que
   * de laisser le navigateur trancher au milieu d'un mot.
   */
  private static readonly MAX_PART_LENGTH = 60;

  /** Derniers segments fournis par la page, conservés pour pouvoir recomposer. */
  private parts: string[] = [];

  /** Segment de tête, hors du contrôle des pages — le minuteur, aujourd'hui. */
  private prefix: string | null = null;

  constructor(private readonly title: Title) {
  }

  /**
   * `set('PRJ-12', 'Refaire le métré de la façade')`
   *   → « PRJ-12 · Refaire le métré de la façade · Paikady »
   *
   * Les segments vides sont ignorés : un appel partiel — le temps qu'une donnée
   * se charge — produit quand même un titre lisible.
   */
  set(...parts: (string | null | undefined)[]): void {
    this.parts = parts
      .map(part => (part ?? '').toString().trim())
      .filter(part => part.length > 0)
      .map(part => this.truncate(part));

    this.render();
  }

  /**
   * Pose (ou retire, avec `null`) le segment placé **avant** tout le reste.
   *
   * Appelé à chaque seconde par le minuteur : on ne réécrit le titre que s'il
   * a réellement changé, pour ne pas solliciter le navigateur pour rien.
   */
  setPrefix(prefix: string | null): void {
    const next = prefix?.trim() || null;
    if (next === this.prefix) {
      return;
    }
    this.prefix = next;
    this.render();
  }

  /** Revient au titre nu, sans contexte de page. Le préfixe, lui, subsiste. */
  reset(): void {
    this.parts = [];
    this.render();
  }

  private render(): void {
    const segments = this.prefix ? [this.prefix, ...this.parts] : [...this.parts];

    segments.push(PageTitleService.APP_NAME);
    this.title.setTitle(segments.join(PageTitleService.SEPARATOR));
  }

  private truncate(value: string): string {
    if (value.length <= PageTitleService.MAX_PART_LENGTH) {
      return value;
    }
    return value.slice(0, PageTitleService.MAX_PART_LENGTH - 1).trimEnd() + '…';
  }
}
