package com.kinga.followtask.dto.rapport;

import java.util.List;

/**
 * Une tâche (issue enfant) telle qu'elle apparaît dans le rapport du projet.
 *
 * @param statutLibelle        doublon volontaire de {@code statut.getLibelle()} :
 *                             le client Angular reçoit le libellé prêt à
 *                             afficher sans maintenir sa propre traduction
 * @param statutWorkflow       statut configuré du workflow ({@code Issue.status}),
 *                             affiché en regard du statut dérivé : un écart
 *                             entre les deux signale une demande mal tenue à jour
 * @param pourcentageExecution avancement de la tâche (0-100)
 * @param totalHeuresPassees   heures réellement écoulées, en heures décimales
 * @param heuresPlanifiees     heures prévues par le planning, en heures décimales
 * @param ecartHeures          réalisé - planifié : positif si la tâche déborde
 * @param nombreReports        nombre d'événements issus d'un report ; un chiffre
 *                             élevé révèle une tâche qui glisse de semaine en
 *                             semaine sans que l'avancement ne le montre
 */
public record TacheRapportDTO(String nom,
                              StatutTache statut,
                              String statutLibelle,
                              String statutWorkflow,
                              int pourcentageExecution,
                              List<TempsParPersonneDTO> tempsParPersonne,
                              double totalHeuresPassees,
                              double heuresPlanifiees,
                              double ecartHeures,
                              int nombreReports) {
}
