/**
 * Etat du rattachement WhatsApp d'un utilisateur.
 *
 * <p>Le sens de l'echange est impose par WhatsApp : c'est l'utilisateur qui
 * ecrit au numero du systeme, jamais le contraire. `pendingCode` est donc le
 * code qu'il doit recopier depuis son telephone, pas un secret qu'il aurait
 * recu.</p>
 */
export interface WhatsAppLinkState {
  linked: boolean;
  linkedValue?: string | null;
  linkedDisplayName?: string | null;
  /** Code a envoyer, tant qu'il n'est pas expire. */
  pendingCode?: string | null;
  pendingExpiresAt?: string | null;
  /** Numero du systeme auquel envoyer le code. */
  serviceNumber?: string | null;
  codeValidityMinutes?: number | null;
}
