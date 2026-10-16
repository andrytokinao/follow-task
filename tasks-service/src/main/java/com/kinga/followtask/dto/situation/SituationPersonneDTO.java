package com.kinga.followtask.dto.situation;

import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.service.situation.EtatPersonne;

import java.time.LocalDateTime;

/**
 * Un ouvrier dans l'ecran « Situation du jour ».
 *
 * @param departement      espace de l'activite en cours, a defaut le premier ou il est assignable
 * @param activite         activite en cours ; null s'il n'y en a pas
 * @param rienDepuis       debut du trou en cours ; null s'il n'y en a pas
 * @param minutesAttendues heures de travail ecoulees aujourd'hui, en minutes
 * @param minutesCouvertes part couverte par le planning, en minutes
 */
public record SituationPersonneDTO(UserApp personne,
                                   String departement,
                                   EtatPersonne etat,
                                   ActiviteSituationDTO activite,
                                   LocalDateTime rienDepuis,
                                   long minutesAttendues,
                                   long minutesCouvertes) {
}
