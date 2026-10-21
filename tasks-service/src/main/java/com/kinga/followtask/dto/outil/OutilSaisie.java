package com.kinga.followtask.dto.outil;

import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.entity.enumapp.TypeOutil;

/**
 * Creation ou modification d'un outil (DT-019). Les fichiers s'ajoutent
 * ensuite, un par un ({@code POST /api/outils/{id}/fichiers}).
 *
 * @param id       null pour creer
 * @param dossierId null : a la racine du dossier de son type
 * @param icone     classe Font Awesome ; null : l'icone du type
 */
public record OutilSaisie(Long id,
                          String titre,
                          String description,
                          TypeOutil typeOutil,
                          PorteeOutil portee,
                          Long dossierId,
                          String url,
                          String version,
                          String icone) {
}
