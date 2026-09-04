package com.kinga.followtask.dto.rapport;

import java.util.List;

/**
 * Activité d'une équipe sur un espace de travail.
 *
 * <p>Ce n'est pas un troisième genre de rapport : c'est un rapport par personne
 * dont la sélection est faite par l'appartenance à un groupe, augmenté du nom de
 * celui-ci. Une équipe dit donc exactement ce que diraient ses membres retenus
 * un à un, et la synthèse porte sur l'équipe entière.</p>
 *
 * @param personnes membres de l'équipe, y compris ceux sans aucune heure : leur
 *                  inactivité est une information du rapport, pas un oubli
 */
public record RapportEquipeDTO(Long equipeId,
                               String nomEquipe,
                               SynthesePersonnesDTO synthese,
                               List<RapportPersonneDTO> personnes) {
}
