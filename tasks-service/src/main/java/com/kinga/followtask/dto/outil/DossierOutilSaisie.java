package com.kinga.followtask.dto.outil;

import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.entity.enumapp.TypeOutil;

/**
 * Creation ou renommage d'un dossier du menu Outils (DT-019). Apres creation,
 * seul le nom change : type, portee et parent sont figes, pour que le contenu
 * reste toujours rangeable dans son dossier.
 *
 * @param id       null pour creer
 * @param parentId null : directement sous le dossier racine du type
 */
public record DossierOutilSaisie(Long id, String nom, TypeOutil typeOutil, PorteeOutil portee, Long parentId) {
}
