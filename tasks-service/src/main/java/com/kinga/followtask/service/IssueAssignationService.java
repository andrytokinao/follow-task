package com.kinga.followtask.service;

import com.kinga.followtask.config.ObserverIdsColumn;
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
 * Seul endroit où l'état d'assignation d'une tâche est écrit.
 *
 * Deux stockages coexistent et doivent rester d'accord :
 *
 * - les {@link IssueMembership} de rôle ASSIGNEE, qui portent l'assignation
 *   multiple et son historique (qui, quand, par qui) ;
 * - {@code Issue.assigne}, champ historique conservé pour les affichages, les
 *   filtres et les actions, renseigné avec le premier assigné.
 *
 * S'y ajoute {@code observerIds}, la liste de ceux qu'un évènement sur la tâche
 * doit atteindre.
 *
 * Ces trois écritures étaient dispersées : assignUsers les faisait toutes,
 * ActionService.saveAction n'écrivait que {@code Issue.assigne}. Une tâche
 * assignée par le second chemin n'avait donc aucun membership, et toute
 * question « qui est assigné ? » posée via les memberships — celle que pose la
 * notification de commentaire — ne trouvait personne.
 *
 * Ce service ne dépend que des dépôts : il ne crée ni action ni notification.
 * C'est délibéré — cela évite le cycle qui apparaîtrait si ActionService et
 * IssueMembershipService devaient s'appeler l'un l'autre, et laisse à chaque
 * appelant le soin de tracer l'évènement comme il l'entend.
 */
@Service
@RequiredArgsConstructor
public class IssueAssignationService {

    private final IssueMembershipRepository membershipRepository;
    private final IssueRepository issueRepository;
    private final UserAppRepository userAppRepository;
    private final ObserverIdsColumn observerIdsColumn;

    /**
     * @param issue     la tâche après mise à jour
     * @param nouveaux  ceux qui viennent d'être assignés, et eux seuls : ce
     *                  sont les seuls à notifier. Réassigner quelqu'un qui
     *                  l'était déjà ne doit rien déclencher.
     */
    public record Resultat(Issue issue, List<UserApp> nouveaux) {
    }

    /**
     * Remplace la liste des assignés par celle passée en paramètre : les
     * membres absents sont désassignés, les nouveaux sont ajoutés.
     */
    @Transactional
    public Resultat appliquer(Long issueId, List<String> userIds, String executorId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue introuvable : " + issueId));

        Set<String> cibles = userIds == null ? new LinkedHashSet<>() : userIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        UserApp executeur = executorId == null ? null : userAppRepository.findById(executorId).orElse(null);
        LocalDateTime maintenant = LocalDateTime.now();

        List<IssueMembership> actifs = membershipRepository.findByIssueIdAndUnassignedAtIsNull(issueId);
        Set<String> dejaAssignes = actifs.stream()
                .filter(m -> m.getRole() == IssueRole.ASSIGNEE)
                .map(m -> m.getUser().getId())
                .collect(Collectors.toSet());

        for (IssueMembership membership : actifs) {
            if (membership.getRole() == IssueRole.ASSIGNEE && !cibles.contains(membership.getUser().getId())) {
                membership.setUnassignedAt(maintenant);
                membership.setUnassignedBy(executeur);
                membershipRepository.save(membership);
            }
        }

        List<UserApp> assignes = new ArrayList<>();
        List<UserApp> nouveaux = new ArrayList<>();
        for (String userId : cibles) {
            UserApp user = userAppRepository.findById(userId).orElse(null);
            if (user == null) {
                continue;
            }
            assignes.add(user);
            // observerIds ne doit jamais limiter le nombre d'assignes : la
            // colonne est elargie au demarrage, et si la conversion echoue on
            // cesse de l'alimenter plutot que de refuser l'assignation.
            if (observerIdsColumn.canAdd(issue.getObserverIds(), userId)) {
                issue.addObserverIds(userId);
            }
            if (dejaAssignes.contains(userId)) {
                continue;
            }
            IssueMembership membership = new IssueMembership();
            membership.setIssue(issue);
            membership.setUser(user);
            membership.setRole(IssueRole.ASSIGNEE);
            membership.setAssignedAt(maintenant);
            membership.setAssignedBy(executeur);
            membershipRepository.save(membership);
            nouveaux.add(user);
        }

        issue.setAssigne(assignes.isEmpty() ? null : assignes.get(0));
        issue = issueRepository.save(issue);

        return new Resultat(issue, nouveaux);
    }

    /**
     * Rattrape une tâche dont l'assignation ne vit que dans {@code Issue.assigne}.
     *
     * Les tâches assignées avant l'arrivée des memberships, ou par un chemin qui
     * ne les écrivait pas, n'en ont aucun : elles restent invisibles à toute
     * requête qui passe par eux. On cree le membership manquant sans toucher a
     * l'assigne ni notifier — c'est une mise en conformite, pas un evenement.
     */
    @Transactional
    public void rattraperMembershipManquant(Long issueId) {
        Issue issue = issueRepository.findById(issueId).orElse(null);
        if (issue == null || issue.getAssigne() == null || issue.getAssigne().getId() == null) {
            return;
        }
        boolean dejaPresent = membershipRepository.findByIssueIdAndUnassignedAtIsNull(issueId).stream()
                .anyMatch(m -> m.getRole() == IssueRole.ASSIGNEE
                        && m.getUser() != null
                        && issue.getAssigne().getId().equalsIgnoreCase(m.getUser().getId()));
        if (dejaPresent) {
            return;
        }
        IssueMembership membership = new IssueMembership();
        membership.setIssue(issue);
        membership.setUser(issue.getAssigne());
        membership.setRole(IssueRole.ASSIGNEE);
        membership.setAssignedAt(LocalDateTime.now());
        membershipRepository.save(membership);

        if (observerIdsColumn.canAdd(issue.getObserverIds(), issue.getAssigne().getId())) {
            issue.addObserverIds(issue.getAssigne().getId());
            issueRepository.save(issue);
        }
    }
}
