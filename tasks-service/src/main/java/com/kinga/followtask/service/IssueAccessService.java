package com.kinga.followtask.service;

import com.kinga.followtask.config.PermissionIssue;
import com.kinga.followtask.entity.GroupeUser;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.MemberGroupe;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.IssueRole;
import com.kinga.followtask.repository.IssueMembershipRepository;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.MemberGroupeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor

public class IssueAccessService {

    private final IssueMembershipRepository membershipRepository;
    private final IssueRepository issueRepository;
    private final MemberGroupeRepository memberGroupeRepository;
    private final AuthorizationService authorizationService;
    private final PermissionIssue permissionIssue;

    public boolean canView(Long issueId, String userId) {
        return membershipRepository
                .findByIssueIdAndUserIdAndUnassignedAtIsNull(issueId, userId)
                .isPresent();
    }

    public boolean canEdit(Long issueId, String userId) {
        return membershipRepository
                .findByIssueIdAndUserIdAndUnassignedAtIsNull(issueId, userId)
                .map(m -> m.getRole().atLeast(IssueRole.ASSIGNEE))
                .orElse(false);
    }

    public boolean canManageMembers(Long issueId, String userId) {
        return membershipRepository
                .findByIssueIdAndUserIdAndUnassignedAtIsNull(issueId, userId)
                .map(m -> m.getRole().atLeast(IssueRole.ADMIN))
                .orElse(false);
    }

    /**
     * Accessibilites effectives de l'utilisateur sur une issue, sans prefixe
     * de projet ({@code CAN_EDIT_TASK}, {@code PROJECT_MANAGER}...).
     *
     * <p>Union de :</p>
     * <ul>
     *   <li>ses roles dans les groupes du projet (ceux que le profil porte
     *   deja sous la forme {@code PREFIX_ROLE}) ;</li>
     *   <li>ses adhesions ouvertes sur l'issue et sur chacun de ses ancetres,
     *   traduites par {@code issue-authorization} : etre assigne a la demande
     *   racine donne les droits de gestionnaire sur toute l'arborescence.</li>
     * </ul>
     *
     * <p>Calcule a la demande pour une seule issue plutot qu'injecte dans le
     * profil : le profil resterait sinon proportionnel au nombre
     * d'assignations et perimerait a chaque (des)assignation.</p>
     */
    @Transactional(readOnly = true)
    public Set<String> issueAccessibilities(String projectPrefix, String issueKey, UserApp user) {
        Set<String> accessibilities = new HashSet<>();
        if (user == null || projectPrefix == null || issueKey == null) {
            return accessibilities;
        }
        Optional<Issue> issue = issueRepository.findFirstByIssueKeyAndProjectPrefix(issueKey, projectPrefix);
        if (issue.isEmpty()) {
            return accessibilities;
        }

        for (MemberGroupe memberGroupe : memberGroupeRepository.findByUserIdAndGroupeType(user.getId(), GroupeUser.PROJECT_GROUPE)) {
            if (!projectPrefix.equals(memberGroupe.getGroupe().getPrefix()) || memberGroupe.getRoles() == null) {
                continue;
            }
            memberGroupe.getRoles().forEach(role -> addRoleAccessibilities(role, accessibilities));
        }

        // `visited` protege d'un cycle parent accidentel en base.
        Set<Long> visited = new HashSet<>();
        for (Issue current = issue.get(); current != null && visited.add(current.getId()); current = current.getParent()) {
            Map<IssueRole, String> mapping = current.getParent() == null
                    ? permissionIssue.getMaster()
                    : permissionIssue.getChild();
            membershipRepository.findByIssueIdAndUserIdAndUnassignedAtIsNull(current.getId(), user.getId())
                    .map(membership -> mapping.get(membership.getRole()))
                    .ifPresent(role -> addRoleAccessibilities(role, accessibilities));
        }
        return accessibilities;
    }

    private void addRoleAccessibilities(String roleName, Set<String> accessibilities) {
        accessibilities.addAll(authorizationService.resolveTaskAccessibilities(roleName));
    }
}
