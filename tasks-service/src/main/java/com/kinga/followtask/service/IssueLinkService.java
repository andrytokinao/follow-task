package com.kinga.followtask.service;

import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class IssueLinkService {

    private final IssueRepository issueRepository;
    private final CanalRepository canallRepository;
    private final MessagesRepository messageAppRepository;
    private final IssueCanalLinkRepository canalLinkRepository;
    private final IssueMessageLinkRepository messageLinkRepository;
    private final IssueLinkRepository issueLinkRepository;
    private final IssueAccessService issueAccessService;
    private final AuthorizationService authorizationService;

    // ---------- Canal ----------

    public void linkCanalToIssue(Long canalId, Long issueId, UserApp currentUser) {
        boolean alreadyLinked = canalLinkRepository
                .findByIssueIdAndCanalIdAndEndedAtIsNull(issueId, canalId).isPresent();
        if (alreadyLinked) return;

        IssueCanalLink link = new IssueCanalLink();
        link.setIssue(issueRepository.getReferenceById(issueId));
        link.setCanal(canallRepository.getReferenceById(canalId));
        link.setSince(LocalDateTime.now());
        link.setLinkedAt(LocalDateTime.now());
        link.setLinkedBy(currentUser);
        canalLinkRepository.save(link);
    }

    public void unlinkCanalFromIssue(Long canalId, Long issueId) {
        canalLinkRepository.findByIssueIdAndCanalIdAndEndedAtIsNull(issueId, canalId)
                .ifPresent(link -> {
                    link.setEndedAt(LocalDateTime.now());
                    canalLinkRepository.save(link);
                });
    }

    // ---------- Message (par id interne) ----------

    public void linkMessageToIssue(Long messageId, Long issueId, UserApp currentUser) {
        if (messageLinkRepository.existsByIssueIdAndMessageId(issueId, messageId)) return;

        IssueMessageLink link = new IssueMessageLink();
        link.setIssue(issueRepository.getReferenceById(issueId));
        link.setMessage(messageAppRepository.getReferenceById(messageId));
        link.setLinkedAt(LocalDateTime.now());
        link.setLinkedBy(currentUser);
        messageLinkRepository.save(link);
    }

    // ---------- Message (par id externe, venant de MessagingController) ----------

    public void linkMessageByExternalId(String externalMessageId, Long issueId, UserApp currentUser) {
        MessageApp message = messageAppRepository.findByExternalMessageId(externalMessageId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Message non trouvé/synchronisé : " + externalMessageId));
        linkMessageToIssue(message.getId(), issueId, currentUser);
    }

    // ---------- Tâche (prédécesseur, bloquant, déclencheur...) ----------

    /** Accessibilités qui permettent de lier une tâche, sur la source ou la destination. */
    private static final Set<String> LINK_ACCESSIBILITIES = Set.of("CAN_EDIT_TASK", "CAN_EDIT_ALL");

    @Transactional(readOnly = true)
    public List<IssueLink> outgoingLinks(Long issueId) {
        return issueLinkRepository.findBySourceIdAndRemovedAtIsNull(issueId);
    }

    @Transactional(readOnly = true)
    public List<IssueLink> incomingLinks(Long issueId) {
        return issueLinkRepository.findByDestinationIdAndRemovedAtIsNull(issueId);
    }

    /**
     * Crée le lien {@code source type destination}, ou réactive celui qui
     * avait été retiré. Les deux tâches peuvent être de départements
     * différents.
     *
     * <p>Pour un lien de dépendance ({@link LinkType#isDependency()}), refuse
     * ce qui rendrait le planning incalculable : un cycle, ou un lien entre une
     * tâche et l'une de ses ancêtres, que la hiérarchie ordonne déjà.</p>
     */
    @Transactional
    public IssueLink linkIssues(Long sourceId, Long destinationId, LinkType type,
                                DependencyMode mode, Integer lagDays, UserApp currentUser) {
        if (type == null) {
            throw new IllegalArgumentException("Type de lien obligatoire");
        }
        if (sourceId == null || sourceId.equals(destinationId)) {
            throw new IllegalArgumentException("Une tâche ne peut pas être liée à elle-même");
        }
        Issue source = issueRepository.findById(sourceId)
                .orElseThrow(() -> new EntityNotFoundException("Tâche introuvable : " + sourceId));
        Issue destination = issueRepository.findById(destinationId)
                .orElseThrow(() -> new EntityNotFoundException("Tâche introuvable : " + destinationId));
        checkCanLink(source, destination, currentUser);

        IssueLink link = issueLinkRepository.findBySourceIdAndDestinationIdAndType(sourceId, destinationId, type)
                .orElseGet(IssueLink::new);
        if (link.getId() != null && link.getRemovedAt() == null) {
            return link;
        }
        if (type.isDependency()) {
            checkHierarchy(source, destination);
            checkNoCycle(source, destination);
        }

        link.setType(type);
        link.setSource(source);
        link.setDestination(destination);
        link.setMode(mode != null ? mode : DependencyMode.FINISH_TO_START);
        link.setLagDays(lagDays != null ? lagDays : 0);
        link.setCreatedAt(LocalDateTime.now());
        link.setCreatedBy(currentUser);
        link.setRemovedAt(null);
        link.setRemovedBy(null);
        return issueLinkRepository.save(link);
    }

    /** Change la contrainte de planning d'un lien, sans toucher à ses extrémités. */
    @Transactional
    public IssueLink updateIssueLink(Long linkId, DependencyMode mode, Integer lagDays, UserApp currentUser) {
        IssueLink link = activeLink(linkId);
        checkCanLink(link.getSource(), link.getDestination(), currentUser);
        if (mode != null) {
            link.setMode(mode);
        }
        if (lagDays != null) {
            link.setLagDays(lagDays);
        }
        return issueLinkRepository.save(link);
    }

    @Transactional
    public boolean unlinkIssues(Long linkId, UserApp currentUser) {
        IssueLink link = activeLink(linkId);
        checkCanLink(link.getSource(), link.getDestination(), currentUser);
        link.setRemovedAt(LocalDateTime.now());
        link.setRemovedBy(currentUser);
        issueLinkRepository.save(link);
        return true;
    }

    private IssueLink activeLink(Long linkId) {
        return issueLinkRepository.findById(linkId)
                .filter(link -> link.getRemovedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Lien introuvable : " + linkId));
    }

    /**
     * Il suffit de pouvoir modifier l'une des deux tâches : on déclare aussi
     * bien « ma tâche bloque celle-ci » que « ma tâche est bloquée par
     * celle-ci ».
     */
    private void checkCanLink(Issue source, Issue destination, UserApp user) {
        if (authorizationService.hasSystemAccessibility(user, "CAN_ACCESS_ALL")
                || canEdit(source, user) || canEdit(destination, user)) {
            return;
        }
        throw new AccessDeniedException("Vous n'avez pas le droit de lier "
                + source.getIssueKey() + " et " + destination.getIssueKey());
    }

    private boolean canEdit(Issue issue, UserApp user) {
        // Même repli que IssueAccessService : sans projet, celui du type.
        String prefix = issue.getProject() != null ? issue.getProject().getPrefix()
                : issue.getIssueType() != null && issue.getIssueType().getProject() != null
                ? issue.getIssueType().getProject().getPrefix() : null;
        return issueAccessService.issueAccessibilities(prefix, issue.getIssueKey(), user).stream()
                .anyMatch(LINK_ACCESSIBILITIES::contains);
    }

    private void checkHierarchy(Issue source, Issue destination) {
        if (isAncestor(source, destination) || isAncestor(destination, source)) {
            throw new IllegalArgumentException("Une tâche ne peut pas dépendre de sa tâche parente ou de ses sous-tâches : "
                    + source.getIssueKey() + " / " + destination.getIssueKey());
        }
    }

    private boolean isAncestor(Issue ancestor, Issue issue) {
        Set<Long> visited = new HashSet<>();
        for (Issue current = issue.getParent(); current != null && visited.add(current.getId()); current = current.getParent()) {
            if (current.getId().equals(ancestor.getId())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Le lien source → destination ferme un cycle si la source est déjà
     * atteignable depuis la destination. Parcours en largeur, une requête par
     * niveau.
     */
    private void checkNoCycle(Issue source, Issue destination) {
        List<LinkType> dependencyTypes = Arrays.stream(LinkType.values()).filter(LinkType::isDependency).toList();
        Set<Long> visited = new HashSet<>(Set.of(destination.getId()));
        Set<Long> frontier = Set.of(destination.getId());
        while (!frontier.isEmpty()) {
            Set<Long> next = new HashSet<>();
            for (Long id : issueLinkRepository.findDestinationIds(frontier, dependencyTypes)) {
                if (id.equals(source.getId())) {
                    throw new IllegalArgumentException("Ce lien créerait une boucle de dépendances entre "
                            + source.getIssueKey() + " et " + destination.getIssueKey());
                }
                if (visited.add(id)) {
                    next.add(id);
                }
            }
            frontier = next;
        }
    }
}