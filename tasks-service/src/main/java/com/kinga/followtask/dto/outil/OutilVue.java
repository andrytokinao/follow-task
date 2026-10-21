package com.kinga.followtask.dto.outil;

import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.entity.enumapp.TypeOutil;

import java.util.List;

/**
 * Outil tel que l'ecran l'affiche (DT-019).
 *
 * @param chemin     dossiers ou il est range, du premier niveau au sien
 *                   (« Sécurité › Antivirus ») ; vide a la racine du type
 * @param espaceNom  espace de creation ; null si partage avec tous
 * @param modifiable l'utilisateur connecte peut le modifier ou le supprimer
 * @param icone      classe Font Awesome choisie ; null : l'icone du type
 */
public record OutilVue(Long id,
                       String titre,
                       String description,
                       TypeOutil typeOutil,
                       PorteeOutil portee,
                       Long dossierId,
                       String chemin,
                       String url,
                       String version,
                       String icone,
                       String espaceNom,
                       UserApp auteur,
                       String dateCreation,
                       String dateModification,
                       List<FichierOutilVue> fichiers,
                       boolean modifiable) {
}
