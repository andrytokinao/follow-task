import {NgZone} from '@angular/core';

/** Décalage appliqué au panneau, en pixels, par rapport à sa place calculée. */
interface Decalage {
  x: number;
  y: number;
}

/**
 * Garde un panneau de mat-menu entièrement dans l'écran, et le rend
 * déplaçable à la souris, pendant toute la durée où il est ouvert.
 *
 * Le CDK place le panneau une fois, à l'ouverture, d'après sa taille à ce
 * moment-là. Quand son contenu grandit ensuite — un projet qu'on déplie, une
 * section qui apparaît — le bas sortait de l'écran : inaccessible, puisque
 * l'overlay ne défile pas avec la page.
 *
 * Ici, à chaque changement de taille (et au redimensionnement ou défilement
 * de la fenêtre), le panneau est :
 * - borné à la hauteur de l'écran, au-delà son contenu défile ;
 * - ramené juste assez pour rester visible, sans que son haut passe au-dessus
 *   de l'écran.
 *
 * Déplacement : une poignée (barre de titre, barre de préhension) se saisit à
 * la souris. Le déplacement demandé est retenu, mais reste soumis à la même
 * contrainte — on ne peut pas sortir le panneau de l'écran. Il n'est pas
 * mémorisé d'une ouverture à l'autre : le panneau s'ouvre toujours à côté du
 * clic.
 *
 * Le décalage passe par `position: relative; top/left` sur le panneau : le CDK
 * ne touche pas à ces styles, et `transform` est déjà pris par l'animation
 * d'entrée de Material.
 */
export class PanneauDansEcran {

  private panneau?: HTMLElement;
  private observateur?: ResizeObserver;
  /** Invalide une prise en charge encore en attente si le menu s'est refermé entre-temps. */
  private generation = 0;
  private image?: number;

  /** Déplacement demandé à la souris, remis à zéro à chaque ouverture. */
  private demande: Decalage = {x: 0, y: 0};
  /** Décalage réellement appliqué, après contrainte d'écran. */
  private applique: Decalage = {x: 0, y: 0};

  private poignees?: string;
  private depart?: {souris: Decalage; demande: Decalage};

  private readonly surFenetre = () => this.planifier();
  private readonly surPointerDown = (event: PointerEvent) => this.commencerDeplacement(event);
  private readonly surPointerMove = (event: PointerEvent) => this.deplacer(event);
  private readonly surPointerUp = () => this.terminerDeplacement();

  constructor(private zone: NgZone, private marge = 8) {
  }

  /**
   * À appeler à l'ouverture du menu.
   *
   * @param poignees sélecteur CSS des éléments par lesquels le panneau se
   *                 saisit (barre de titre…). Absent : panneau non déplaçable.
   */
  suivre(panelId: string, poignees?: string): void {
    this.arreter();
    this.poignees = poignees;
    const generation = this.generation;
    // Le panneau est inséré dans l'overlay pendant l'ouverture : on attend
    // qu'il soit en place pour le mesurer.
    requestAnimationFrame(() => {
      const panneau = document.getElementById(panelId);
      if (generation !== this.generation || !panneau) {
        return;
      }
      this.panneau = panneau;
      // Hors zone Angular : ce ne sont que des styles, aucune détection de
      // changements n'est nécessaire à chaque image.
      this.zone.runOutsideAngular(() => {
        this.observateur = new ResizeObserver(() => this.ajuster());
        this.observateur.observe(panneau);
        window.addEventListener('resize', this.surFenetre);
        window.addEventListener('scroll', this.surFenetre, {capture: true, passive: true});
        if (this.poignees) {
          // Délégué sur le panneau : la poignée vit dans un contenu que
          // Material recrée, et peut apparaître après l'ouverture.
          panneau.addEventListener('pointerdown', this.surPointerDown);
        }
      });
      this.ajuster();
    });
  }

  /** À appeler à la fermeture du menu. */
  arreter(): void {
    this.generation++;
    this.terminerDeplacement();
    this.observateur?.disconnect();
    this.observateur = undefined;
    window.removeEventListener('resize', this.surFenetre);
    window.removeEventListener('scroll', this.surFenetre, {capture: true});
    this.panneau?.removeEventListener('pointerdown', this.surPointerDown);
    if (this.image != null) {
      cancelAnimationFrame(this.image);
      this.image = undefined;
    }
    this.panneau = undefined;
    // Le panneau s'ouvre de nouveau à côté du clic : le déplacement précédent
    // ne le suit pas.
    this.demande = {x: 0, y: 0};
    this.applique = {x: 0, y: 0};
  }

  /** Après le repositionnement du CDK, qui réagit lui aussi au défilement. */
  private planifier(): void {
    if (this.image != null) {
      return;
    }
    this.image = requestAnimationFrame(() => {
      this.image = undefined;
      this.ajuster();
    });
  }

  // ─── Déplacement ───────────────────────────────────────────────────────────

  private commencerDeplacement(event: PointerEvent): void {
    if (event.button !== 0 || !this.poignees || !this.panneau) {
      return;
    }
    const cible = event.target as HTMLElement | null;
    // Une poignée n'est une poignée que dans ce panneau : un formulaire ouvert
    // dans un autre menu peut avoir la même barre de titre.
    const poignee = cible?.closest(this.poignees);
    if (!poignee || !this.panneau.contains(poignee)) {
      return;
    }
    // Les boutons de la barre de titre (fermer, modifier) gardent leur rôle.
    if (cible?.closest('button, a, input, textarea, select')) {
      return;
    }
    this.depart = {souris: {x: event.clientX, y: event.clientY}, demande: {...this.demande}};
    // Sans cela, saisir la barre de titre sélectionne le texte au passage.
    event.preventDefault();
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', this.surPointerMove);
    window.addEventListener('pointerup', this.surPointerUp);
    window.addEventListener('pointercancel', this.surPointerUp);
  }

  private deplacer(event: PointerEvent): void {
    if (!this.depart) {
      return;
    }
    this.demande = {
      x: this.depart.demande.x + (event.clientX - this.depart.souris.x),
      y: this.depart.demande.y + (event.clientY - this.depart.souris.y),
    };
    this.ajuster();
  }

  private terminerDeplacement(): void {
    if (!this.depart) {
      return;
    }
    this.depart = undefined;
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', this.surPointerMove);
    window.removeEventListener('pointerup', this.surPointerUp);
    window.removeEventListener('pointercancel', this.surPointerUp);
    // Le déplacement retenu est celui qu'on a pu appliquer : sinon, repousser
    // le panneau contre un bord accumulerait un décalage invisible, qu'il
    // faudrait « rembourser » avant de le voir repartir dans l'autre sens.
    this.demande = {...this.applique};
  }

  // ─── Contrainte d'écran ────────────────────────────────────────────────────

  private ajuster(): void {
    const panneau = this.panneau;
    // Le cadre (cdk-overlay-pane) porte la position calculée par le CDK ; le
    // décalage relatif du panneau ne le déplace pas, on peut donc le mesurer
    // à chaque fois sans cumuler les corrections.
    const cadre = panneau?.parentElement;
    if (!panneau || !cadre) {
      return;
    }
    const ecran = {largeur: window.innerWidth, hauteur: window.innerHeight};
    panneau.style.maxHeight = `${ecran.hauteur - 2 * this.marge}px`;

    const place = cadre.getBoundingClientRect();
    // offsetHeight/Width ignorent l'animation d'entrée (transform: scale).
    const haut = place.top + (panneau.offsetTop - this.applique.y);
    const gauche = place.left + (panneau.offsetLeft - this.applique.x);

    this.applique = {
      x: this.contraindre(this.demande.x, gauche, panneau.offsetWidth, ecran.largeur),
      y: this.contraindre(this.demande.y, haut, panneau.offsetHeight, ecran.hauteur),
    };
    panneau.style.position = 'relative';
    panneau.style.left = `${Math.round(this.applique.x)}px`;
    panneau.style.top = `${Math.round(this.applique.y)}px`;
  }

  /**
   * Décalage retenu sur un axe : celui demandé, ramené entre les deux bords.
   * Le bord « début » (haut, gauche) l'emporte quand le panneau est plus
   * grand que l'écran — mieux vaut voir son début que sa fin.
   */
  private contraindre(demande: number, place: number, taille: number, ecran: number): number {
    const min = this.marge - place;
    const max = Math.max(min, ecran - this.marge - place - taille);
    return Math.min(Math.max(demande, min), max);
  }
}
