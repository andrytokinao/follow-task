package com.kinga.followtask.web;

import com.kinga.followtask.config.CurrentUserProvider;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.service.IssueAbonnementService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.List;

/**
 * Abonnement aux issues. Toujours pour l'utilisateur connecte : on ne
 * s'abonne pas a la place d'un autre.
 */
@Controller
@RequiredArgsConstructor
public class GQAbonnementController {

    private final IssueAbonnementService issueAbonnementService;
    private final CurrentUserProvider currentUserProvider;

    @MutationMapping
    public List<String> abonnerIssue(@Argument Long issueId, @Argument Boolean abonne) {
        UserApp user = currentUserProvider.getCurrentUser();
        return new ArrayList<>(issueAbonnementService.definirAbonnement(
                issueId, user == null ? null : user.getId(), Boolean.TRUE.equals(abonne)));
    }
}
