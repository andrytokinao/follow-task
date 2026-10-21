import {ComponentRef, Type, ViewContainerRef} from '@angular/core';
import {Issue} from '../../type/issue';

/**
 * Section de la popup d'aperçu chargée après l'issue (pièces jointes,
 * commentaires) : son composant est importé à la volée, puis créé dans son
 * emplacement avec les entrées tirées de l'issue. L'aperçu ne l'attend pas.
 *
 * À la volée : les modules qui déclarent ces composants mènent eux-mêmes à la
 * popup ; un import statique ferait une boucle.
 */
export class SectionDifferee {

  private ref?: ComponentRef<any>;
  private importEnCours = false;
  /** Issue de la section montée ou en cours d'import. */
  private issueId?: number;

  /**
   * @param importer charge le composant (`import()`)
   * @param entrees  ses entrées, pour une issue
   * @param prete    le composant a reçu ses données ; par défaut, dès sa création
   */
  constructor(private readonly importer: () => Promise<Type<unknown>>,
              private readonly entrees: (issue: Issue) => Record<string, unknown>,
              private readonly prete: (instance: any) => boolean = () => true) {
  }

  /** Code à importer, ou données pas encore reçues : l'indication de chargement. */
  get enCours(): boolean {
    return this.importEnCours || (!!this.ref && !this.prete(this.ref.instance));
  }

  /** La section de cette issue est montée, ou en passe de l'être. */
  estPour(issueId: number): boolean {
    return this.issueId === issueId;
  }

  /** Monte la section pour l'issue ; `hote` est lu après l'import, quand l'emplacement existe. */
  async monter(issue: Issue, hote: () => ViewContainerRef | undefined, rafraichir: () => void): Promise<void> {
    if (this.estPour(issue.id as number)) {
      return;
    }
    this.oublier();
    this.issueId = issue.id as number;
    this.importEnCours = true;
    const composant = await this.importer();
    this.importEnCours = false;
    const emplacement = hote();
    // Une autre issue entre-temps, ou plus de popup : la section n'est plus la sienne.
    if (!this.estPour(issue.id as number) || !emplacement) {
      rafraichir();
      return;
    }
    this.ref = emplacement.createComponent(composant);
    Object.entries(this.entrees(issue)).forEach(([nom, valeur]) => this.ref!.setInput(nom, valeur));
    rafraichir();
  }

  oublier(): void {
    this.ref?.destroy();
    this.ref = undefined;
    this.issueId = undefined;
    this.importEnCours = false;
  }
}
