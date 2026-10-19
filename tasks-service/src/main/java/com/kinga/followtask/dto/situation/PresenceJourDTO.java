package com.kinga.followtask.dto.situation;

import java.time.LocalDate;
import java.util.List;

/**
 * Planning des ouvriers un jour ouvrable passé, ou aujourd'hui jusqu'à
 * maintenant (Gantt de direction).
 *
 * @param ouvriers   ouvriers suivis de l'espace
 * @param absents    aucune activité renseignée sur les heures de travail
 * @param incomplets une partie seulement des heures renseignée (manque au-delà du seuil des rappels)
 */
public record PresenceJourDTO(LocalDate jour,
                              int ouvriers,
                              List<PresencePersonneDTO> absents,
                              List<PresencePersonneDTO> incomplets) {
}
