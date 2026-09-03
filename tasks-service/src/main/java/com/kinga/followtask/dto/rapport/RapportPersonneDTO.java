package com.kinga.followtask.dto.rapport;

import java.util.List;

/**
 * Rapport d'activité d'une personne sur un espace de travail.
 *
 * Le point de vue est symétrique de celui du rapport de projet : on ne demande
 * plus « où en est ce projet » mais « qu'a fait cette personne, et sur quoi ».
 * Les compteurs de statut portent donc sur ses tâches à elle, et les heures sur
 * ses seuls événements.
 *
 * @param partDuTemps     part de cette personne dans le temps total du rapport
 *                        (0-100) : sans elle, comparer deux intervenants
 *                        obligerait à refaire la division
 * @param avancementMoyen moyenne des avancements de ses tâches. C'est un
 *                        indicateur d'ensemble, pas une performance : une tâche
 *                        est menée à plusieurs
 */
public record RapportPersonneDTO(String nomPersonne,
                                 String username,
                                 String email,
                                 double heuresPassees,
                                 double heuresPlanifiees,
                                 double ecartHeures,
                                 int partDuTemps,
                                 int avancementMoyen,
                                 int nombreProjets,
                                 int nombreTaches,
                                 int nombreTerminees,
                                 int nombreEnCours,
                                 int nombreEnRetard,
                                 int nombreBloquees,
                                 int nombreReportees,
                                 int nombreNonDemarrees,
                                 List<TempsParProjetDTO> repartitionParProjet,
                                 List<TachePersonneDTO> taches) {
}
