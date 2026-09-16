package com.kinga.followtask.service;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueMembership;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.IssueRole;
import com.kinga.followtask.repository.IssueMembershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Gestion des assignations multiples d'une issue.
 * L'assignation est portee par IssueMembership (role ASSIGNEE) ; le champ
 * Issue.assigne reste renseigne avec le premier assigne pour compatibilite
 * avec l'existant (affichages, filtres, actions).
 *
 * L'ecriture de l'etat est deleguee a IssueAssignationService, partage avec
 * ActionService : ce service-ci n'orchestre plus que la trace de l'evenement.
 */
@Service
@RequiredArgsConstructor
public class IssueMembershipService {

    private final IssueMembershipRepository membershipRepository;
    private final ActionService actionService;
    private final IssueAssignationService assignationService;

    public List<IssueMembership> getMemberships(Long issueId) {
        return membershipRepository.findByIssueIdAndUnassignedAtIsNull(issueId);
    }

    /**
     * Remplace la liste des assignes de l'issue par celle passee en parametre :
     * les membres absents de la liste sont desassignes, les nouveaux sont ajoutes.
     */
    @Transactional
    public Issue assignUsers(Long issueId, List<String> userIds, String executorId) {
        // L'ecriture de l'etat est tenue par IssueAssignationService, partagee
        // avec ActionService.saveAction : les deux chemins laissaient sinon la
        // tache dans des etats differents. Ne reste ici que la trace de
        // l'evenement, qui n'a de sens que pour les nouveaux assignes.
        IssueAssignationService.Resultat resultat =
                assignationService.appliquer(issueId, userIds, executorId);
        for (UserApp user : resultat.nouveaux()) {
            actionService.ceateAssigneAction(executorId, resultat.issue(), user);
        }
        return resultat.issue();
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
