package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.PorteeOutil;

/**
 * Ce qui decide qui voit et qui modifie un element du menu Outils (DT-019) :
 * sa portee, son espace de travail et son auteur. Commun aux dossiers et aux
 * outils, pour que les droits s'ecrivent une seule fois.
 */
public interface RattachementOutil {

    PorteeOutil getPortee();

    /** Espace de travail de creation ; null si partage avec tous les espaces. */
    Project getProject();

    UserApp getAuteur();
}
