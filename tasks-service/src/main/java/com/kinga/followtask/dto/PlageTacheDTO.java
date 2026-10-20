package com.kinga.followtask.dto;

import java.time.LocalDateTime;

/**
 * Temps occupé par une séance de planning sur une tâche, déjà normalisé
 * ({@code PlagesPlanifiees}). Le Gantt de direction en tire l'effectif de
 * chaque projet, jour par jour.
 */
public record PlageTacheDTO(String userId, Long issueId, LocalDateTime debut, LocalDateTime fin) {
}
