package com.kinga.followtask.dto.situation;

import java.time.LocalDateTime;

/**
 * Activite du planning qu'un ouvrier mene en ce moment.
 *
 * @param etat               etat d'execution de l'activite (PENDING, IN_PROGRESS, BLOCKED, EXTENDED...)
 * @param cleTache           tache de l'activite ; null si l'activite n'est rattachee a aucune tache
 * @param cleProjet          projet (demande racine) de la tache ; null si la tache est elle-meme le projet
 * @param prefixeDepartement prefixe de l'espace de travail, pour le lien vers la tache
 */
public record ActiviteSituationDTO(Long id,
                                   String titre,
                                   LocalDateTime debut,
                                   LocalDateTime fin,
                                   String etat,
                                   Integer avancement,
                                   String cleTache,
                                   String tache,
                                   String cleProjet,
                                   String projet,
                                   String prefixeDepartement) {
}
