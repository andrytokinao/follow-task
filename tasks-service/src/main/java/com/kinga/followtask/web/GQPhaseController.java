package com.kinga.followtask.web;

import com.kinga.followtask.dto.Response;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Phase;
import com.kinga.followtask.service.PhaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

/** Phases : groupes de types de tache (schéma {@code phases.graphqls}). */
@Controller
@RequiredArgsConstructor
public class GQPhaseController {

    private final PhaseService phaseService;

    @QueryMapping
    public List<Phase> phasesByProject(@Argument Long projectId) {
        return phaseService.phasesByProject(projectId);
    }

    @MutationMapping
    public Phase savePhase(@Argument Phase phase) {
        return phaseService.savePhase(phase);
    }

    @MutationMapping
    public Response deletePhase(@Argument Long phaseId) {
        return phaseService.deletePhase(phaseId);
    }

    @MutationMapping
    public IssueType setIssueTypePhase(@Argument Long issueTypeId, @Argument Long phaseId) {
        return phaseService.setIssueTypePhase(issueTypeId, phaseId);
    }
}
