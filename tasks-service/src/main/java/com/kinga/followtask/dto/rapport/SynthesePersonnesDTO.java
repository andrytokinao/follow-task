package com.kinga.followtask.dto.rapport;

import java.util.List;

/**
 * Chiffres consolidés d'un rapport portant sur plusieurs personnes.
 *
 * Les heures s'additionnent sans risque de doublon — un événement a un seul
 * exécutant — mais pas les tâches : deux personnes travaillant sur la même
 * tâche ne font qu'une tâche. Les compteurs de tâches sont donc établis sur
 * l'ensemble dédoublonné.
 *
 * @param repartitionParPersonne temps de chaque personne du rapport, du plus
 *                               gros contributeur au plus petit ; alimente le
 *                               graphique de répartition
 */
public record SynthesePersonnesDTO(int nombrePersonnes,
                                   double totalHeures,
                                   double heuresPlanifiees,
                                   double ecartHeures,
                                   int nombreProjets,
                                   int nombreTaches,
                                   int nombreTerminees,
                                   int nombreEnCours,
                                   int nombreEnRetard,
                                   int nombreBloquees,
                                   int nombreReportees,
                                   int nombreNonDemarrees,
                                   List<TempsParPersonneDTO> repartitionParPersonne) {
}
