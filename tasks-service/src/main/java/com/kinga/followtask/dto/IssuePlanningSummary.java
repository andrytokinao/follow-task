package com.kinga.followtask.dto;

import com.kinga.followtask.entity.Issue;
import lombok.Data;

import java.util.List;

@Data
public class IssuePlanningSummary {
    private Issue issue;

    private Integer totalMinutes;     // Somme totale de tous les events (issue + enfants)
    private Integer spentMinutes;     // Temps passé (events terminés)
    private Integer remainingMinutes; // Temps restant (events en cours ou futurs)
    private List<UserPlanningStat> userTimes;
}
