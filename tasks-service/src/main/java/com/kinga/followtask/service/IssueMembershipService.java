package com.kinga.followtask.service;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueMembership;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.IssueRole;
import com.kinga.followtask.repository.IssueMembershipRepository;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.UserAppRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Gestion des assignations multiples d'une issue.
 * L'assignation est portee par IssueMembership (role ASSIGNEE) ; le champ
 * Issue.assigne reste renseigne avec le premier assigne pour compatibilite
 * avec l'existant (affichages, filtres, actions).
 */
@Service
@RequiredArgsConstructor
public class IssueMembershipService {

    private final IssueMembershipRepository membershipRepository;
    private final IssueRepository issueRepository;
    private final UserAppRepository userAppRepository;
    private final ActionService actionService;

    public List<IssueMembership> getMemberships(Long issueId) {
        return membershipRepository.findByIssueIdAndUnassignedAtIsNull(issueId);
    }

    /**
     * Remplace la liste des assignes de l'issue par celle passee en parametre :
     * les membres absents de la liste sont desassignes, les nouveaux sont ajoutes.
     */
    @Transactional
    public Issue assignUsers(Long issueId, List<String> userIds, String executorId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue introuvable : " + issueId));

        Set<String> targets = userIds == null ? new LinkedHashSet<>() : userIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        UserApp executor = executorId == null ? null : userAppRepository.findById(executorId).orElse(null);
        LocalDateTime now = LocalDateTime.now();

        List<IssueMembership> actives = membershipRepository.findByIssueIdAndUnassignedAtIsNull(issueId);
        Set<String> alreadyAssigned = actives.stream()
                .filter(m -> m.getRole() == IssueRole.ASSIGNEE)
                .map(m -> m.getUser().getId())
                .collect(Collectors.toSet());

        // desassignation de ceux qui ne sont plus dans la liste
        for (IssueMembership membership : actives) {
            if (membership.getRole() == IssueRole.ASSIGNEE && !targets.contains(membership.getUser().getId())) {
                membership.setUnassignedAt(now);
                membership.setUnassignedBy(executor);
                membershipRepository.save(membership);
            }
        }

        // ajout des nouveaux assignes
        List<UserApp> assignes = new ArrayList<>();
        List<UserApp> newlyAssigned = new ArrayList<>();
        for (String userId : targets) {
            UserApp user = userAppRepository.findById(userId).orElse(null);
            if (user == null) {
                continue;
            }
            assignes.add(user);
            issue.addObserverIds(userId);
            if (alreadyAssigned.contains(userId)) {
                continue;
            }
            IssueMembership membership = new IssueMembership();
            membership.setIssue(issue);
            membership.setUser(user);
            membership.setRole(IssueRole.ASSIGNEE);
            membership.setAssignedAt(now);
            membership.setAssignedBy(executor);
            membershipRepository.save(membership);
            newlyAssigned.add(user);
        }

        issue.setAssigne(assignes.isEmpty() ? null : assignes.get(0));
        issue = issueRepository.save(issue);

        for (UserApp user : newlyAssigned) {
            actionService.ceateAssigneAction(executorId, issue, user);
        }
        return issue;
    }

    /**
     * Ajoute un assigne sans toucher aux autres.
     */
    @Transactional
    public Issue addAssignee(Long issueId, String userId, String executorId) {
        List<String> userIds = currentAssigneeIds(issueId);
        if (!userIds.contains(userId)) {
            userIds.add(userId);
        }
        return assignUsers(issueId, userIds, executorId);
    }

    /**
     * Retire un assigne sans toucher aux autres.
     */
    @Transactional
    public Issue removeAssignee(Long issueId, String userId, String executorId) {
        List<String> userIds = currentAssigneeIds(issueId);
        userIds.remove(userId);
        return assignUsers(issueId, userIds, executorId);
    }

    private List<String> currentAssigneeIds(Long issueId) {
        return membershipRepository.findByIssueIdAndUnassignedAtIsNull(issueId).stream()
                .filter(m -> m.getRole() == IssueRole.ASSIGNEE)
                .map(m -> m.getUser().getId())
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
