package com.kinga.followtask.dto.rapport;

import java.util.List;

/**
 * Vue d'ensemble du projet, en tête de rapport.
 *
 * Elle répond aux questions que l'on se pose avant d'entrer dans le détail des
 * tâches : combien de temps a été consommé, par combien de personnes, et où se
 * concentrent les difficultés.
 *
 * @param repartitionParPersonne temps cumulé de chaque intervenant sur
 *                               l'ensemble des tâches, du plus gros
 *                               contributeur au plus petit ; alimente le
 *                               graphique de répartition
 * @param tachesSansPlanning     tâches sans aucun événement : invisibles dans le
 *                               suivi du temps, donc à replanifier
 * @param tachesSansAssigne      tâches sans personne assignée
 * @param ecartHeures            réalisé - planifié sur l'ensemble du projet
 */
public record SyntheseProjetDTO(double totalHeures,
                                double heuresPlanifiees,
                                double ecartHeures,
                                int nombreIntervenants,
                                int nombreTaches,
                                int nombreTerminees,
                                int nombreEnCours,
                                int nombreEnRetard,
                                int nombreBloquees,
                                int nombreReportees,
                                int nombreNonDemarrees,
                                int tachesSansPlanning,
                                int tachesSansAssigne,
                                List<TempsParPersonneDTO> repartitionParPersonne) {
}
