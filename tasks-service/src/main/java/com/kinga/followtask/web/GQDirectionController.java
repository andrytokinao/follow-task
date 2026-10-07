package com.kinga.followtask.web;

import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.service.DirectionService;
import graphql.GraphQLContext;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cockpit de direction (schéma {@code direction.graphqls}).
 *
 * <p>Les projets sont des {@code Issue} : le front choisit les champs dont il a
 * besoin, et les champs propres au cockpit s'ajoutent au type {@code Issue}
 * sans toucher à l'entité.</p>
 *
 * <p>Mêmes permissions que le garde Angular ({@code direction.guard.ts}) : la
 * direction, l'administrateur du système et le super-administrateur.</p>
 */
@Controller
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('CAN_VIEW_DIRECTION', 'SYSTEM_ADMIN', 'CAN_ACCESS_ALL')")
public class GQDirectionController {

    /**
     * Rapports déjà calculés pendant la requête, par identifiant de projet :
     * {@code rapportProjet}, {@code santeProjet} et {@code prochaineEcheance}
     * en ont besoin tous les trois, un rapport complet ne se calcule qu'une fois.
     */
    private static final String RAPPORTS = "direction.rapports";

    private final DirectionService directionService;

    @QueryMapping
    public List<String> directionDepartements() {
        return directionService.departements();
    }

    @QueryMapping
    public List<Issue> directionProjets(@Argument String departement, GraphQLContext contexte) {
        return directionService.projets(departement, rapports(contexte));
    }

    // ------------------------------------------------------------------
    // Champs ajoutés au type Issue
    // ------------------------------------------------------------------

    @SchemaMapping(typeName = "Issue", field = "rapportProjet")
    public RapportProjetDTO rapportProjet(Issue issue, GraphQLContext contexte) {
        return rapport(issue, contexte);
    }

    @SchemaMapping(typeName = "Issue", field = "santeProjet")
    public String santeProjet(Issue issue, GraphQLContext contexte) {
        return directionService.sante(rapport(issue, contexte));
    }

    @SchemaMapping(typeName = "Issue", field = "prochaineEcheance")
    public Issue prochaineEcheance(Issue issue, GraphQLContext contexte) {
        return directionService.prochaineEcheance(issue, rapport(issue, contexte));
    }

    @SchemaMapping(typeName = "Issue", field = "finPlanifiee")
    public LocalDateTime finPlanifiee(Issue issue) {
        return directionService.finPlanifiee(issue);
    }

    @SchemaMapping(typeName = "Issue", field = "dateDebutTraitement")
    public LocalDateTime dateDebutTraitement(Issue issue) {
        return directionService.dateDebutTraitement(issue);
    }

    // ------------------------------------------------------------------

    private RapportProjetDTO rapport(Issue issue, GraphQLContext contexte) {
        return rapports(contexte).computeIfAbsent(issue.getId(), id -> directionService.rapport(issue));
    }

    private Map<Long, RapportProjetDTO> rapports(GraphQLContext contexte) {
        Map<Long, RapportProjetDTO> rapports = contexte.get(RAPPORTS);
        if (rapports == null) {
            rapports = new ConcurrentHashMap<>();
            contexte.put(RAPPORTS, rapports);
        }
        return rapports;
    }
}
