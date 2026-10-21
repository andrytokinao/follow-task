package com.kinga.followtask.dto;

import java.time.LocalDateTime;

/**
 * Ce qu'une arborescence de fichiers affiche d'un upload : son auteur et sa
 * date, par chemin. Lu en une requete, sans charger les entites Uploaded,
 * Document et UserApp (associations chargees d'office).
 */
public record MetaUpload(String path,
                         String firstName,
                         String lastName,
                         String username,
                         String photo,
                         LocalDateTime uploadDate) {
}
