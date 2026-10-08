package com.kinga.followtask.service;

import com.kinga.followtask.config.ObserverIdsColumn;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.repository.IssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Abonnement d'un utilisateur a une issue.
 *
 * S'abonner, c'est entrer dans {@code Issue.observerIds} : la liste que chaque
 * action (commentaire, statut, upload, assignation...) consulte pour savoir qui
 * notifier. Les assignes y sont deja ajoutes par {@link IssueAssignationService} ;
 * l'abonnement ouvre la meme liste a ceux qui veulent suivre sans etre assignes.
 */
@Service
@RequiredArgsConstructor
public class IssueAbonnementService {

    private final IssueRepository issueRepository;
    private final ObserverIdsColumn observerIdsColumn;

    /**
     * Abonne (true) ou desabonne (false) l'utilisateur, puis renvoie la liste
     * des abonnes a jour.
     */
    @Transactional
    public Set<String> definirAbonnement(Long issueId, String userId, boolean abonne) {
        if (userId == null) {
            throw new IllegalArgumentException("Utilisateur non identifie.");
        }
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue introuvable : " + issueId));
        Set<String> abonnes = issue.getObserverIds() == null ? new HashSet<>() : new HashSet<>(issue.getObserverIds());
        if (abonne == abonnes.contains(userId)) {
            return abonnes;
        }
        if (abonne) {
            // Meme garde que pour les assignes : une colonne non elargie ne
            // doit pas faire echouer l'enregistrement de l'issue entiere.
            if (!observerIdsColumn.canAdd(abonnes, userId)) {
                throw new IllegalArgumentException("La liste des abonnes de cette issue est pleine.");
            }
            abonnes.add(userId);
        } else {
            abonnes.remove(userId);
        }
        issue.setObserverIds(abonnes);
        issueRepository.save(issue);
        return abonnes;
    }
}
