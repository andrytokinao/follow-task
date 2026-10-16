package com.kinga.followtask.service.rappel;

import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.enumapp.ExecutionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Plages de temps occupees par des activites du planning.
 *
 * <ul>
 *   <li>Une activite reportee ne compte pas : sa copie, a la nouvelle date, la remplace.</li>
 *   <li>Une activite « toute la journee » couvre ses journees entieres.</li>
 *   <li>Sans fin, une activite dure une heure, comme sa copie lors d'un report.</li>
 * </ul>
 */
public final class PlagesPlanifiees {

    private PlagesPlanifiees() {
    }

    public static List<Plage> de(List<PlanningEvent> evenements) {
        return evenements.stream()
                .filter(e -> e.getStartTime() != null)
                .filter(e -> e.getExecutionStatus() != ExecutionStatus.POSTPONED)
                .map(PlagesPlanifiees::plage)
                .filter(Objects::nonNull)
                .toList();
    }

    private static Plage plage(PlanningEvent e) {
        LocalDateTime debut = e.getStartTime();
        LocalDateTime fin = e.getEndTime() != null ? e.getEndTime() : debut.plusHours(1);
        if (e.isAllDay()) {
            debut = debut.toLocalDate().atStartOfDay();
            fin = fin.toLocalDate().plusDays(1).atStartOfDay();
        }
        return fin.isAfter(debut) ? new Plage(debut, fin) : null;
    }
}
