package com.kinga.followtask.web;

import com.kinga.followtask.dto.PhaseSaisie;
import com.kinga.followtask.dto.Response;
import com.kinga.followtask.dto.TypesSousTacheParPhase;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Phase;
import com.kinga.followtask.entity.Status;
import com.kinga.followtask.service.PhaseService;
import com.kinga.followtask.service.phase.PhaseStatutService;
import com.kinga.followtask.service.phase.PhaseTacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

/** Phases d'un projet (schéma {@code phases.graphqls}). */
@Controller
@RequiredArgsConstructor
public class GQPhaseController {

    private final PhaseService phaseService;
    private final PhaseStatutService phaseStatutService;
    private final PhaseTacheService phaseTacheService;

    // ---- phases ----

    @QueryMapping
    public List<Phase> phasesByProject(@Argument Long projectId) {
        return phaseService.phasesByProject(projectId);
    }

    @MutationMapping
    public Phase savePhase(@Argument PhaseSaisie phase) {
        return phaseService.savePhase(phase);
    }

    @MutationMapping
    public Response deletePhase(@Argument Long phaseId) {
        return phaseService.deletePhase(phaseId);
    }

    @MutationMapping
    public List<Phase> ordonnerPhases(@Argument List<Long> phaseIds) {
        return phaseService.ordonnerPhases(phaseIds);
    }

    // ---- phases et statuts du projet ----

    @QueryMapping
    public List<Status> statutsProjetPourPhases(@Argument Long projectId) {
        return phaseStatutService.statutsProjet(projectId);
    }

    @MutationMapping
    public Phase lierStatutPhase(@Argument Long phaseId, @Argument Long statusId) {
        return phaseStatutService.lierStatut(phaseId, statusId);
    }

    @MutationMapping
    public Phase delierStatutPhase(@Argument Long phaseId, @Argument Long statusId) {
        return phaseStatutService.delierStatut(phaseId, statusId);
    }

    // ---- phases des types ----

    @MutationMapping
    public IssueType setIssueTypePhases(@Argument Long issueTypeId, @Argument List<Long> phaseIds) {
        return phaseService.setIssueTypePhases(issueTypeId, phaseIds);
    }

    /** Premiere version : une seule phase par type. */
    @Deprecated
    @MutationMapping
    public IssueType setIssueTypePhase(@Argument Long issueTypeId, @Argument Long phaseId) {
        return phaseService.setIssueTypePhases(issueTypeId, phaseId == null ? List.of() : List.of(phaseId));
    }

    /** Premiere version : une seule phase par type. */
    @Deprecated
    @SchemaMapping(typeName = "IssueType", field = "phase")
    public Phase phaseDuType(IssueType issueType) {
        return issueType.getPhases() == null || issueType.getPhases().isEmpty() ? null : issueType.getPhases().get(0);
    }

    // ---- phase des taches ----

    @QueryMapping
    public TypesSousTacheParPhase typesSousTacheParPhase(@Argument Long parentIssueId) {
        return phaseTacheService.typesSousTache(parentIssueId);
    }

    @MutationMapping
    public Issue setIssuePhase(@Argument Long issueId, @Argument Long phaseId) {
        return phaseTacheService.setIssuePhase(issueId, phaseId);
    }

    @SchemaMapping(typeName = "Issue", field = "phaseCourante")
    public Phase phaseCourante(Issue issue) {
        return phaseTacheService.phaseCourante(issue).orElse(null);
    }
}
