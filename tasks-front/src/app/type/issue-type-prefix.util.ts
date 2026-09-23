/**
 * Regle de saisie du prefixe d'un type de tache, partagee par tous les
 * formulaires : le serveur applique la meme a l'enregistrement.
 *
 * <p>Le prefixe se retrouve dans chaque cle (DATA-102) : il reste court et sans
 * espace, sinon les cles deviennent illisibles et ambigues.</p>
 */

/** Longueur maximale d'un prefixe. Au dela, le champ est signale en rouge. */
export const PREFIX_MAX_LENGTH = 10;

/**
 * Prefixe debarrasse de ses espaces : ceux de tete et de fin sont retires,
 * ceux qui separent deux mots deviennent un tiret bas.
 *
 * <p>La longueur n'est pas tronquee : un prefixe trop long est signale dans le
 * champ, on ne coupe pas la saisie de l'utilisateur.</p>
 */
export function normalizePrefix(value: string | null | undefined): string {
  return ('' + (value ?? '')).trim().replace(/\s+/g, '_');
}

/**
 * Prefixe pret a etre enregistre : sans espace ni tiret bas en tete et en fin.
 * Un « MON PREFIXE » suivi d'un espace est enregistre « MON_PREFIXE ».
 */
export function cleanPrefixForSave(value: string | null | undefined): string {
  return normalizePrefix(value).replace(/^_+/, '').replace(/_+$/, '');
}

/** true quand le prefixe saisi depasse la longueur admise. */
export function isPrefixTooLong(value: string | null | undefined): boolean {
  return normalizePrefix(value).length > PREFIX_MAX_LENGTH;
}
