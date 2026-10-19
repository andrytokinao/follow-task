package com.kinga.followtask.dto;

import java.time.LocalDateTime;

/**
 * Temps occupé par une séance de planning d'une personne, déjà normalisé
 * ({@code PlagesPlanifiees}) : sans fin, une heure ; « toute la journée », des
 * journées entières. Le Gantt de direction en tire les absences.
 */
public record PlageMembreDTO(String userId, LocalDateTime debut, LocalDateTime fin) {
}
