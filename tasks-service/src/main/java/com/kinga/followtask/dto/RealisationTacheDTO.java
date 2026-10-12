package com.kinga.followtask.dto;

import com.kinga.followtask.entity.UserApp;

import java.time.LocalDateTime;

/**
 * Une séance de travail sur une tâche, telle que le planning l'a enregistrée :
 * une barre du diagramme de Gantt du cockpit de direction.
 *
 * @param fin        fin de la séance ; null si elle n'a pas été renseignée
 * @param avancement avancement de la tâche déclaré à l'issue de la séance ;
 *                   null si rien n'a été déclaré
 * @param etat       {@code ExecutionStatus} de l'événement : PENDING,
 *                   IN_PROGRESS, COMPLETED, BLOCKED, POSTPONED, EXTENDED
 */
public record RealisationTacheDTO(Long id,
                                  String titre,
                                  LocalDateTime debut,
                                  LocalDateTime fin,
                                  Integer avancement,
                                  String etat,
                                  UserApp intervenant) {
}
