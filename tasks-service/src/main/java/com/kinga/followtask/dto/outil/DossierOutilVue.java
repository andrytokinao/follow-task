package com.kinga.followtask.dto.outil;

import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.entity.enumapp.TypeOutil;

/**
 * Dossier du menu Outils tel que l'ecran l'affiche (DT-019).
 *
 * @param espaceNom   espace de creation ; null si partage avec tous
 * @param modifiable  l'utilisateur connecte peut le renommer ou le supprimer
 */
public record DossierOutilVue(Long id,
                              String nom,
                              TypeOutil typeOutil,
                              PorteeOutil portee,
                              Long parentId,
                              String espaceNom,
                              UserApp auteur,
                              String dateCreation,
                              boolean modifiable) {
}
