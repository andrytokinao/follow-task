package com.kinga.followtask.dto.rapport;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Rapport d'avancement d'un projet, c'est-à-dire d'une issue racine et de ses
 * tâches directes.
 *
 * Structure unique produite par {@code RapportService}, consommée telle quelle
 * par les trois canaux : page Thymeleaf, PDF et JSON pour l'aperçu Angular.
 *
 * @param dateDebut        date de création de l'issue racine
 * @param dateFin          fin planifiée la plus tardive parmi les événements du
 *                         projet, {@code null} si aucun événement n'est planifié
 * @param avancementGlobal avancement du projet (0-100)
 */
public record RapportProjetDTO(String titre,
                               String description,
                               String chefDeProjet,
                               LocalDateTime dateDebut,
                               LocalDateTime dateFin,
                               String statut,
                               int avancementGlobal,
                               List<TacheRapportDTO> taches) {
}
