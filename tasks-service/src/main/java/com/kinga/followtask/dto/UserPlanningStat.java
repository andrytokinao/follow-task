package com.kinga.followtask.dto;

import com.kinga.followtask.entity.UserApp;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.graphql.data.method.annotation.Argument;

import java.util.List;
@Data
@AllArgsConstructor
public class UserPlanningStat {
    private UserApp user;
    private int totalMinutes;     // Somme totale de tous les events (issue + enfants)
    private int spentMinutes;     // Temps passé (events terminés)
    private int remainingMinutes; // Temps restant (events en cours ou futurs)
}
