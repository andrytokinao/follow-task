package com.kinga.followtask.service.rappel;

import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.enumapp.ExecutionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
                .map(PlagesPlanifiees::plageDe)
                .flatMap(Optional::stream)
                .toList();
    }

    /** Plage occupee par une activite ; vide si elle ne compte pas (reportee, sans debut). */
    public static Optional<Plage> plageDe(PlanningEvent e) {
        if (e.getStartTime() == null || e.getExecutionStatus() == ExecutionStatus.POSTPONED) {
            return Optional.empty();
        }
        LocalDateTime debut = e.getStartTime();
        LocalDateTime fin = e.getEndTime() != null ? e.getEndTime() : debut.plusHours(1);
        if (e.isAllDay()) {
            debut = debut.toLocalDate().atStartOfDay();
            fin = fin.toLocalDate().plusDays(1).atStartOfDay();
        }
        return fin.isAfter(debut) ? Optional.of(new Plage(debut, fin)) : Optional.empty();
    }
}
