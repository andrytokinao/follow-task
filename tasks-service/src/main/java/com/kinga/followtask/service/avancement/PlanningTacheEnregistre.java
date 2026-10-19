package com.kinga.followtask.service.avancement;

/**
 * Un creneau rattache a une tache vient d'etre enregistre (DT-007).
 *
 * @param issueId  tache du creneau
 * @param auteurId utilisateur qui a enregistre le creneau ; il signe le
 *                 changement de statut qui en decoule
 */
public record PlanningTacheEnregistre(Long issueId, String auteurId) {
}
