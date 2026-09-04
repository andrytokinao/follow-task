import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UserService} from '../../../../../services/user.service';
import {User} from '../../../../../type/issue';

/**
 * Définition du mot de passe d'un compte par un administrateur.
 *
 * <p>Ce n'est pas un changement de mot de passe : l'actuel n'est pas demandé,
 * un administrateur ne le connaît pas. C'est donc une opération sensible — elle
 * donne accès au compte — et l'écran le dit plutôt que de la présenter comme un
 * réglage ordinaire.</p>
 *
 * <p>Le serveur revérifie les droits et la longueur : cet écran est une
 * commodité, pas une garantie.</p>
 */
@Component({
  standalone: false,
  selector: 'app-set-password',
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.css'
})
export class SetPasswordComponent {

  /** Compte visé, renseigné par l'appelant avant l'ouverture. */
  user: User | any = {};

  motDePasse = '';
  confirmation = '';

  /** Le mot de passe est masqué par défaut : on l'affiche pour le relire. */
  visible = false;

  enregistrement = false;
  erreur = '';
  succes = false;

  /** Même règle que le serveur ; lui seul fait foi. */
  readonly longueurMin = 6;

  constructor(public activeModal: NgbActiveModal,
              private userService: UserService) {
  }

  nomComplet(): string {
    const nom = `${this.user?.lastName ?? ''} ${this.user?.firstName ?? ''}`.trim();
    return nom || this.user?.username || 'Utilisateur';
  }

  get tropCourt(): boolean {
    return this.motDePasse.length > 0 && this.motDePasse.length < this.longueurMin;
  }

  get discordant(): boolean {
    return this.confirmation.length > 0 && this.motDePasse !== this.confirmation;
  }

  get valide(): boolean {
    return this.motDePasse.length >= this.longueurMin && this.motDePasse === this.confirmation;
  }

  /**
   * Propose un mot de passe solide.
   *
   * <p>Il est affiché aussitôt : un administrateur doit pouvoir le lire pour le
   * transmettre, sans quoi il en inventerait un plus court.</p>
   */
  proposer(): void {
    const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const aleas = new Uint32Array(12);
    crypto.getRandomValues(aleas);

    this.motDePasse = Array.from(aleas, alea => alphabet[alea % alphabet.length]).join('');
    this.confirmation = this.motDePasse;
    this.visible = true;
    this.erreur = '';
  }

  enregistrer(): void {
    if (!this.valide || this.enregistrement || !this.user?.id) {
      return;
    }
    this.enregistrement = true;
    this.erreur = '';

    this.userService.definirMotDePasse(this.user.id, this.motDePasse).subscribe({
      next: () => {
        this.succes = true;
        this.enregistrement = false;
      },
      error: erreur => {
        // Le serveur renvoie { error: "..." } : son message dit quoi corriger.
        // Un 403 n'en porte pas, d'où le repli explicite sur les droits.
        this.erreur = erreur?.error?.error
          ?? (erreur?.status === 403
            ? "Vous n'avez pas le droit de définir le mot de passe d'un autre compte."
            : "Le mot de passe n'a pas pu être enregistré.");
        this.enregistrement = false;
      }
    });
  }

  fermer(): void {
    this.activeModal.close(this.succes);
  }
}
