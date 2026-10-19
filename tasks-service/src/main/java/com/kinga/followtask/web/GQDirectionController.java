package com.kinga.followtask.web;

import com.kinga.followtask.dto.DependanceTacheDTO;
import com.kinga.followtask.dto.EspaceDirectionDTO;
import com.kinga.followtask.dto.RealisationTacheDTO;
import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.dto.situation.SituationDirectionDTO;
import com.kinga.followtask.entity.CustomField;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.service.DirectionService;
import com.kinga.followtask.service.situation.SituationDirectionService;
import graphql.GraphQLContext;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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
     * {@code directionProjets} les calcule pour écarter les projets terminés,
     * {@code rapportProjet} les réutilise au lieu de les recalculer.
     */
    private static final String RAPPORTS = "direction.rapports";

    private final DirectionService directionService;
    private final SituationDirectionService situationDirectionService;

    @QueryMapping
    public List<String> directionDepartements() {
        return directionService.departements();
    }

    @QueryMapping
    public List<EspaceDirectionDTO> directionEspaces() {
        return directionService.espaces();
    }

    @QueryMapping
    public List<Issue> directionProjets(@Argument String departement, GraphQLContext contexte) {
        return directionService.projets(departement, rapports(contexte));
    }

    /** Situation du jour (DT-005), à l'heure du serveur : celle du planning. */
    @QueryMapping
    public SituationDirectionDTO situationDirection(@Argument String departement) {
        return situationDirectionService.situation(departement, LocalDateTime.now());
    }

    @SchemaMapping(typeName = "Issue", field = "rapportProjet")
    public RapportProjetDTO rapportProjet(Issue issue, GraphQLContext contexte) {
        return rapports(contexte).computeIfAbsent(issue.getId(), id -> directionService.rapport(issue));
    }

    @SchemaMapping(typeName = "Issue", field = "dateDebutTraitement")
    public LocalDateTime dateDebutTraitement(Issue issue) {
        return directionService.dateDebutTraitement(issue);
    }

    @SchemaMapping(typeName = "Issue", field = "dateDemarrage")
    public LocalDateTime dateDemarrage(Issue issue) {
        return directionService.dateChamp(issue, CustomField.CODE_DATE_DEMARRAGE);
    }

    @SchemaMapping(typeName = "Issue", field = "deadline")
    public LocalDateTime deadline(Issue issue) {
        return directionService.dateChamp(issue, CustomField.CODE_DEADLINE);
    }

    @SchemaMapping(typeName = "Issue", field = "realisations")
    public List<RealisationTacheDTO> realisations(Issue issue) {
        return directionService.realisations(issue);
    }

    @SchemaMapping(typeName = "Issue", field = "dependances")
    public List<DependanceTacheDTO> dependances(Issue issue) {
        return directionService.dependances(issue);
    }

    @SchemaMapping(typeName = "Issue", field = "nombreCommentaires")
    public long nombreCommentaires(Issue issue) {
        return directionService.nombreCommentaires(issue);
    }

    @SchemaMapping(typeName = "Issue", field = "nombrePiecesJointes")
    public long nombrePiecesJointes(Issue issue) {
        return directionService.nombrePiecesJointes(issue);
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
