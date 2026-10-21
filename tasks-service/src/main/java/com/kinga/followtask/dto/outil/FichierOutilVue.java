package com.kinga.followtask.dto.outil;

import com.kinga.followtask.entity.UserApp;

/**
 * Fichier d'un outil tel que l'ecran l'affiche (DT-019). Il se telecharge
 * par {@code GET /api/outils/fichiers/{id}}, jamais par son chemin disque.
 *
 * @param supprimable l'utilisateur connecte peut le supprimer
 */
public record FichierOutilVue(Long id,
                              String nom,
                              String typeMime,
                              Long taille,
                              UserApp auteur,
                              String dateAjout,
                              boolean supprimable) {
}
