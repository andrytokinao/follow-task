package com.kinga.followtask.web;

import com.kinga.followtask.config.CurrentUserProvider;
import com.kinga.followtask.dto.RappelPlanning;
import com.kinga.followtask.service.rappel.RappelPlanningService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Rappels de planning (schema {@code rappel-planning.graphqls}). Toujours pour
 * l'utilisateur connecte : chacun ne voit que ses propres trous.
 */
@Controller
@RequiredArgsConstructor
public class GQRappelPlanningController {

    private final RappelPlanningService rappelPlanningService;
    private final CurrentUserProvider currentUserProvider;

    @QueryMapping
    public List<RappelPlanning> mesRappelsPlanning() {
        // Heure du serveur, celle dans laquelle le planning est enregistre.
        return rappelPlanningService.rappelsDe(currentUserProvider.getCurrentUser(), LocalDateTime.now());
    }
}
