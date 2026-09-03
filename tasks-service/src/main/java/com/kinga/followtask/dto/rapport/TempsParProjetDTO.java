package com.kinga.followtask.dto.rapport;

/**
 * Temps passé par une personne sur un projet.
 *
 * Pendant de {@link TempsParPersonneDTO}, vu depuis l'autre bout : le rapport
 * par personne répartit les heures d'un intervenant entre les projets, là où le
 * rapport par projet répartit celles d'un projet entre les intervenants.
 *
 * @param cleProjet   clé de la demande racine (« PRJ-12 »), {@code null} si la
 *                    demande n'en porte pas
 * @param pourcentageDuTemps part de ce projet dans le temps total de la
 *                    personne (0-100)
 */
public record TempsParProjetDTO(String cleProjet,
                                String titreProjet,
                                double heuresPassees,
                                int pourcentageDuTemps) {
}
