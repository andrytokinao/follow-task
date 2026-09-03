package com.kinga.followtask.dto.rapport;

/**
 * Ligne du rapport par personne : une tâche vue depuis un intervenant.
 *
 * Les heures portées ici sont celles de cette personne seule, alors que
 * l'avancement et le statut sont ceux de la tâche entière : une tâche est
 * menée à plusieurs, son avancement n'est pas divisible.
 *
 * @param cleProjet     clé de la demande racine dont dépend la tâche, pour
 *                      situer celle-ci sans avoir à ouvrir l'application
 * @param heuresPassees temps passé par cette personne sur cette tâche
 * @param heuresPlanifiees temps planifié pour cette personne sur cette tâche
 * @param ecartHeures   réalisé - planifié, pour cette personne
 * @param assignee      la personne est assignée à la tâche. Une tâche sans
 *                      événement mais assignée figure au rapport : c'est du
 *                      travail attendu d'elle, précisément ce qu'un rapport
 *                      doit montrer
 */
public record TachePersonneDTO(String cle,
                               String nom,
                               String cleProjet,
                               String titreProjet,
                               StatutTache statut,
                               String statutLibelle,
                               String statutWorkflow,
                               int pourcentageExecution,
                               double heuresPassees,
                               double heuresPlanifiees,
                               double ecartHeures,
                               int nombreReports,
                               boolean assignee) {
}
