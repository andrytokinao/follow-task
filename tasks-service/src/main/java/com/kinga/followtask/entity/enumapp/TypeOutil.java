package com.kinga.followtask.entity.enumapp;

/**
 * Type d'un outil (DT-019). Chaque type est un dossier racine du menu Outils,
 * fixe : on ne le renomme ni ne le supprime. Les dossiers crees par les
 * utilisateurs se rangent sous un type, et un outil ne va que dans un dossier
 * de son type.
 *
 * <p>Enregistre en texte ({@code EnumType.STRING}) : ajouter un type plus tard
 * (WIKI...) ne decale rien en base.</p>
 */
public enum TypeOutil {
    LOGICIEL,
    MODELE_DOCUMENT,
    TUTORIEL_VIDEO,
    LIEN
}
