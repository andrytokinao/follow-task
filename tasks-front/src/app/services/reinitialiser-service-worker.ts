/**
 * Retire le service worker et ses caches, avant un rechargement de secours.
 *
 * Cas traite (prod, 21/10/2026) : la nouvelle version ne s'installe pas
 * (« Failed to retrieve hashed resource », un fichier servi ne correspond
 * pas a son empreinte). Le service worker reste sur l'ancienne version,
 * dont les modules differes n'existent plus sur le serveur : chaque entree
 * dans un espace de travail echoue (« Loading chunk … failed ») et ramene
 * sur /working. Recharger a travers ce service worker resert la meme
 * version : la boucle ne se rompt pas.
 *
 * Sans service worker ni caches, le rechargement repart du reseau, sur la
 * version en place ; le service worker se reinscrit ensuite tout seul.
 * Ne leve jamais : au pire, on recharge comme avant.
 */
export async function reinitialiserServiceWorker(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const inscriptions = await navigator.serviceWorker.getRegistrations();
      await Promise.all(inscriptions.map(inscription => inscription.unregister()));
    }
    if ('caches' in window) {
      // Caches du service worker Angular seulement : ngsw:/…
      const cles = await caches.keys();
      await Promise.all(cles.filter(cle => cle.startsWith('ngsw:')).map(cle => caches.delete(cle)));
    }
  } catch (erreur) {
    console.warn('[APP] Service worker non reinitialise :', erreur);
  }
}
