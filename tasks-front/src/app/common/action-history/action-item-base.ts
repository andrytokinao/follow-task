import { Directive, inject, Input } from '@angular/core';
import { ActionHistorique, User } from '../../type/issue';
import { UserService } from '../../services/user.service';

/** Teinte de la pastille : une par famille d'évènement. */
export type ActionTonalite = 'assign' | 'status' | 'comment' | 'document' | 'neutre';

/**
 * Socle de tout affichage d'une action de l'historique.
 *
 * Chaque nature d'action a son composant, qui hérite d'ici et ne décrit que ce
 * qui lui est propre : son icône, sa teinte et sa phrase. L'auteur, l'avatar
 * et la date sont tenus une seule fois, par ActionItemFrameComponent qui lit
 * cette base.
 *
 * Ajouter une nature d'action : un composant qui étend cette classe, puis une
 * entrée dans ACTION_ITEM_RENDUS (action-item.registry.ts).
 */
@Directive()
export abstract class ActionItemBase {
  @Input({ required: true }) action!: ActionHistorique;

  /** Icône Font Awesome de la pastille, sans le préfixe `fas`. */
  abstract readonly icone: string;
  readonly tonalite: ActionTonalite = 'neutre';

  protected readonly userService = inject(UserService);

  get auteur(): User | undefined {
    return this.action?.actionGroupe?.user;
  }

  get nomAuteur(): string {
    return this.nomDe(this.auteur);
  }

  /** Sans photo, on laisse l'avatar afficher les initiales plutôt que l'image par défaut. */
  get photoAuteur(): string | null {
    return this.auteur?.photo ? this.userService.getUrlPhoto(this.auteur) : null;
  }

  /** « Prénom Nom », à défaut l'identifiant de connexion : jamais une chaîne vide. */
  nomDe(user: User | null | undefined): string {
    if (!user) return 'Quelqu\'un';
    const complet = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return complet || user.username || 'Quelqu\'un';
  }

  /**
   * Texte lisible d'un contenu saisi dans l'éditeur riche. Il est affiché en
   * texte et non en HTML : l'historique résume, il ne remplace pas l'onglet
   * Commentaires.
   */
  extrait(html: string | null | undefined, longueur = 160): string {
    if (!html) return '';
    const texte = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
    const propre = texte.replace(/\s+/g, ' ').trim();
    return propre.length <= longueur ? propre : propre.slice(0, longueur).trim() + '…';
  }
}
