package com.kinga.followtask.dto.rapport;

import java.util.List;

/**
 * Ce que l'utilisateur demande à voir figurer dans un rapport composé.
 *
 * <p>Le rapport n'a pas de « type » : il a un contenu. Chaque section n'existe
 * que si quelque chose a été sélectionné pour elle — aucun drapeau
 * supplémentaire n'est nécessaire, une liste vide dit déjà que la section n'est
 * pas voulue, et deux façons de dire la même chose finiraient par se
 * contredire.</p>
 *
 * @param projectId   espace de travail du rapport. Obligatoire dès qu'une
 *                    personne ou une équipe est retenue : l'activité se mesure
 *                    sur un espace de travail, pas dans l'absolu
 * @param titre       intitulé libre du document ; à défaut, le serveur en
 *                    compose un à partir de ce qui est sélectionné
 * @param projetIds   demandes racines à détailler, dans l'ordre voulu
 * @param personneIds intervenants dont l'activité est reprise individuellement
 * @param equipeIds   équipes reprises en bloc : chacune donne une section avec
 *                    sa propre synthèse et le détail de ses membres
 */
public record DemandeRapportDTO(Long projectId,
                                String titre,
                                List<Long> projetIds,
                                List<String> personneIds,
                                List<Long> equipeIds) {
}
