package com.kinga.followtask.service;

import com.kinga.followtask.config.PermissionIssue;
import com.kinga.followtask.config.RoleApp;
import com.kinga.followtask.entity.GroupeUser;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.MemberGroupe;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.IssueRole;
import com.kinga.followtask.repository.IssueMembershipRepository;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.MemberGroupeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
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
     *   traduites par {@code issue-authorization} : l'assigne d'une issue y
     *   travaille sans pouvoir la reassigner, et gere ses sous-taches.</li>
     * </ul>
     *
     * <p>Calcule a la demande pour une seule issue plutot qu'injecte dans le
     * profil : le profil resterait sinon proportionnel au nombre
     * d'assignations et perimerait a chaque (des)assignation.</p>
     */
    @Transactional(readOnly = true)
    public Set<String> issueAccessibilities(String projectPrefix, String issueKey, UserApp user) {
        if (projectPrefix == null || issueKey == null) {
            return new HashSet<>();
        }
        return issueRepository.findFirstByIssueKeyAndProjectPrefix(issueKey, projectPrefix)
                .map(issue -> issueAccessibilities(issue, user))
                .orElseGet(HashSet::new);
    }

    /**
     * Refuse l'assignation a qui n'a pas {@code CAN_ASSIGN_TASK} sur l'issue :
     * par son role d'espace de travail, ou parce qu'il est assigne a une issue
     * parente. Etre assigne a l'issue elle-meme ne suffit pas.
     */
    @Transactional(readOnly = true)
    public void checkCanAssign(Long issueId, UserApp user) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue introuvable : " + issueId));
        if (authorizationService.hasSystemAccessibility(user, "CAN_ACCESS_ALL")) {
            return;
        }
        if (!issueAccessibilities(issue, user).contains("CAN_ASSIGN_TASK")) {
            throw new AccessDeniedException("Vous n'avez pas le droit d'assigner " + issue.getIssueKey());
        }
    }

    private Set<String> issueAccessibilities(Issue issue, UserApp user) {
        Set<String> accessibilities = new HashSet<>();
        String projectPrefix = projectPrefixOf(issue);
        if (user == null || projectPrefix == null) {
            return accessibilities;
        }

        for (MemberGroupe memberGroupe : memberGroupeRepository.findByUserIdAndGroupeType(user.getId(), GroupeUser.PROJECT_GROUPE)) {
            if (!projectPrefix.equals(memberGroupe.getGroupe().getPrefix()) || memberGroupe.getRoles() == null) {
                continue;
            }
            memberGroupe.getRoles().forEach(role -> addRoleAccessibilities(role, accessibilities));
        }

        // Une adhesion sur l'issue elle-meme donne le role `self` ; sur un
        // ancetre, le role `descendants`. `visited` protege d'un cycle parent
        // accidentel en base.
        Set<Long> visited = new HashSet<>();
        for (Issue current = issue; current != null && visited.add(current.getId()); current = current.getParent()) {
            PermissionIssue.Scope scope = current.getParent() == null
                    ? permissionIssue.getMaster()
                    : permissionIssue.getChild();
            Map<IssueRole, String> mapping = current == issue ? scope.getSelf() : scope.getDescendants();
            membershipRepository.findByIssueIdAndUserIdAndUnassignedAtIsNull(current.getId(), user.getId())
                    .map(membership -> mapping.get(membership.getRole()))
                    .ifPresent(role -> addRoleAccessibilities(role, accessibilities));
        }
        return accessibilities;
    }

    private String projectPrefixOf(Issue issue) {
        if (issue.getProject() != null) {
            return issue.getProject().getPrefix();
        }
        if (issue.getIssueType() != null && issue.getIssueType().getProject() != null) {
            return issue.getIssueType().getProject().getPrefix();
        }
        return null;
    }

    /**
     * Un role d'issue ({@code issue-authorization.roles}) est prioritaire ;
     * ses {@code includes} designent des roles de task-authorization.
     */
    private void addRoleAccessibilities(String roleName, Set<String> accessibilities) {
        Optional<RoleApp> issueRole = permissionIssue.getRoleByName(roleName);
        if (issueRole.isEmpty()) {
            accessibilities.addAll(authorizationService.resolveTaskAccessibilities(roleName));
            return;
        }
        if (issueRole.get().getAccessibilities() != null) {
            accessibilities.addAll(issueRole.get().getAccessibilities());
        }
        if (issueRole.get().getIncludes() != null) {
            issueRole.get().getIncludes()
                    .forEach(included -> accessibilities.addAll(authorizationService.resolveTaskAccessibilities(included)));
        }
    }
}
