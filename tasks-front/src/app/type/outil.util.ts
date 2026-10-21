import {FichierOutil, RegleFichiersOutil} from "./outil";

/* Menu Outils (DT-019) : petites règles d'affichage, fonctions pures. */

const UNITES = ['o', 'Ko', 'Mo', 'Go'];

/** « 2,4 Mo ». */
export function tailleLisible(octets: number | null | undefined): string {
  let taille = octets ?? 0;
  let unite = 0;
  while (taille >= 1024 && unite < UNITES.length - 1) {
    taille /= 1024;
    unite++;
  }
  return `${taille.toLocaleString('fr-FR', {maximumFractionDigits: unite === 0 ? 0 : 1})} ${UNITES[unite]}`;
}

export function extensionFichier(nom: string | null | undefined): string {
  const texte = nom ?? '';
  return texte.includes('.') ? texte.split('.').pop()!.toLowerCase() : '';
}

/** Ce que le navigateur sait lire lui-même : vidéo, son, image, PDF. */
export function fichierLisible(fichier: FichierOutil): 'video' | 'audio' | 'image' | 'pdf' | null {
  const type = fichier.typeMime ?? '';
  if (type.startsWith('video/')) {
    return 'video';
  }
  if (type.startsWith('audio/')) {
    return 'audio';
  }
  if (type === 'image/png' || type === 'image/jpeg') {
    return 'image';
  }
  return type === 'application/pdf' ? 'pdf' : null;
}

/** Attribut `accept` du sélecteur de fichiers : « .docx,.pdf ». */
export function accepte(regle: RegleFichiersOutil | undefined): string {
  return (regle?.extensions ?? []).map(e => '.' + e).join(',');
}

/**
 * Fichier refusé avant l'envoi, avec la même règle que le serveur : le
 * message arrive tout de suite au lieu d'un échec après un long envoi.
 */
export function refusFichier(fichier: File, regle: RegleFichiersOutil | undefined): string | null {
  if (!regle) {
    return null;
  }
  if (fichier.size <= 0) {
    return `« ${fichier.name} » est vide`;
  }
  if (fichier.size > regle.tailleMax) {
    return `« ${fichier.name} » dépasse ${tailleLisible(regle.tailleMax)}`;
  }
  if (!regle.extensions.includes(extensionFichier(fichier.name))) {
    return `« ${fichier.name} » : fichiers acceptés ${regle.extensions.join(', ')}`;
  }
  return null;
}

/** Message lisible d'une erreur GraphQL ou HTTP. */
export function messageErreur(erreur: any, defaut: string): string {
  return erreur?.graphQLErrors?.[0]?.message
    ?? (typeof erreur?.error === 'string' ? erreur.error : null)
    ?? erreur?.message
    ?? defaut;
}
