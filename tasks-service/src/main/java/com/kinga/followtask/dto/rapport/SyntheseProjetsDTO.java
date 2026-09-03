package com.kinga.followtask.dto.rapport;

import java.util.List;

/**
 * Chiffres consolidés d'un rapport portant sur plusieurs projets.
 *
 * Les totaux ne sont pas la somme des synthèses de chaque projet : ils sont
 * recalculés sur l'ensemble des événements dédoublonnés. Sélectionner un projet
 * et l'un de ses sous-projets compterait sinon deux fois les mêmes heures.
 *
 * @param avancementMoyen        moyenne simple des avancements des projets
 *                               retenus : aucune pondération n'est possible,
 *                               le modèle ne portant pas de poids de projet
 * @param repartitionParPersonne temps cumulé de chaque intervenant sur
 *                               l'ensemble des projets du rapport
 */
public record SyntheseProjetsDTO(int nombreProjets,
                                 int avancementMoyen,
                                 double totalHeures,
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
                                 List<TempsParPersonneDTO> repartitionParPersonne) {
}
