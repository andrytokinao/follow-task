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
 * @param chefDeProjet     responsable désigné du projet, ou {@code null} s'il
 *                         n'y en a pas : une absence doit rester une absence,
 *                         et non se confondre avec « personne n'est assigné »
 * @param responsables     personnes assignées à la demande racine. Distinctes du
 *                         chef de projet : dans ce modèle, assigner quelqu'un ne
 *                         le désigne pas responsable
 * @param dateDebut        date de création de l'issue racine
 * @param dateFin          fin planifiée la plus tardive parmi les événements du
 *                         projet, {@code null} si aucun événement n'est planifié
 * @param avancementGlobal avancement du projet (0-100)
 * @param genereLe         horodatage de production du rapport : un document
 *                         imprimé ne dit rien de sa fraîcheur sans cela
 * @param synthese         chiffres d'ensemble et répartition du temps par
 *                         intervenant
 */
public record RapportProjetDTO(String titre,
                               String description,
                               String chefDeProjet,
                               List<String> responsables,
                               LocalDateTime dateDebut,
                               LocalDateTime dateFin,
                               String statut,
                               int avancementGlobal,
                               LocalDateTime genereLe,
                               SyntheseProjetDTO synthese,
                               List<TacheRapportDTO> taches) {
}
