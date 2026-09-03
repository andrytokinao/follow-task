package com.kinga.followtask.dto.rapport;

import java.util.List;

/**
 * Une tâche (issue enfant) telle qu'elle apparaît dans le rapport du projet.
 *
 * @param statutLibelle       doublon volontaire de {@code statut.getLibelle()} :
 *                            le client Angular reçoit le libellé prêt à afficher
 *                            sans avoir à maintenir sa propre table de traduction
 * @param pourcentageExecution avancement de la tâche (0-100)
 * @param totalHeuresPassees  somme des heures des exécutants, en heures décimales
 */
public record TacheRapportDTO(String nom,
                              StatutTache statut,
                              String statutLibelle,
                              int pourcentageExecution,
                              List<TempsParPersonneDTO> tempsParPersonne,
                              double totalHeuresPassees) {
}
