package com.kinga.followtask.web;

import com.kinga.followtask.config.CurrentUserProvider;
import com.kinga.followtask.entity.DependencyMode;
import com.kinga.followtask.entity.IssueLink;
import com.kinga.followtask.entity.LinkType;
import com.kinga.followtask.service.IssueLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

/**
 * Liens entre tâches (schéma {@code issue-links.graphqls}) : prédécesseur,
 * bloquant, déclencheur, simple référence.
 */
@Controller
@RequiredArgsConstructor
public class GQIssueLinkController {

    private final IssueLinkService issueLinkService;
    private final CurrentUserProvider currentUserProvider;

    /** Liens dont la tâche est la source : « A bloque B ». */
    @QueryMapping
    public List<IssueLink> outgoingIssueLinks(@Argument Long issueId) {
        return issueLinkService.outgoingLinks(issueId);
    }

    /** Liens dont la tâche est la destination : « B est bloquée par A ». */
    @QueryMapping
    public List<IssueLink> incomingIssueLinks(@Argument Long issueId) {
        return issueLinkService.incomingLinks(issueId);
    }

    @MutationMapping
    public IssueLink linkIssues(@Argument Long sourceId, @Argument Long destinationId, @Argument LinkType type,
                                @Argument DependencyMode mode, @Argument Integer lagDays) {
        return issueLinkService.linkIssues(sourceId, destinationId, type, mode, lagDays,
                currentUserProvider.getCurrentUser());
    }

    @MutationMapping
    public IssueLink updateIssueLink(@Argument Long linkId, @Argument DependencyMode mode, @Argument Integer lagDays) {
        return issueLinkService.updateIssueLink(linkId, mode, lagDays, currentUserProvider.getCurrentUser());
    }

    @MutationMapping
    public boolean unlinkIssues(@Argument Long linkId) {
        return issueLinkService.unlinkIssues(linkId, currentUserProvider.getCurrentUser());
    }

    @SchemaMapping(typeName = "IssueLink", field = "outwardLabel")
    public String outwardLabel(IssueLink link) {
        return link.getType().getOutwardLabel();
    }

    @SchemaMapping(typeName = "IssueLink", field = "inwardLabel")
    public String inwardLabel(IssueLink link) {
        return link.getType().getInwardLabel();
    }
}
