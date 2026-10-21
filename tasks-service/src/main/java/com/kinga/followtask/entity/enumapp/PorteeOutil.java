package com.kinga.followtask.entity.enumapp;

/**
 * Portee d'un outil ou d'un dossier d'outils (DT-019).
 *
 * <p>Colonne explicite plutot que « pas d'espace = partage » : un outil ne
 * devient jamais visible de tous par accident, il faut l'avoir choisi.</p>
 */
public enum PorteeOutil {
    /** Visible depuis tous les espaces de travail. */
    TOUS_LES_ESPACES,
    /** Visible seulement depuis l'espace de travail ou il a ete cree. */
    ESPACE
}
