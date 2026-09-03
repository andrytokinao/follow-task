package com.kinga.followtask.dto.rapport;

/**
 * Temps passé par une personne sur une tâche.
 *
 * @param nomPersonne      nom affichable de l'exécutant
 * @param heuresPassees    durée écoulée sur ses événements, en heures décimales
 * @param pourcentageDuTemps part de cette personne dans le total de la tâche (0-100)
 */
public record TempsParPersonneDTO(String nomPersonne,
                                  double heuresPassees,
                                  int pourcentageDuTemps) {
}
