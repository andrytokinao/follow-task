package com.kinga.followtask.service.avancement;

import com.kinga.followtask.dto.ActionItemInput;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.entity.enumapp.EtapeAvancement;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.service.ActionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Aligne le statut d'une tache sur son planning (DT-007).
 *
 * <p>Le changement passe par {@link ActionService#saveAction} comme un
 * changement fait a la main : historique, notification et diffusion websocket
 * — c'est elle qui met a jour les listes de taches ouvertes.</p>
 *
 * <p>Ne sont jamais touches :</p>
 * <ul>
 *   <li>un projet (demande racine qui a des sous-taches) : son statut porte
 *       la phase courante ;</li>
 *   <li>une tache dont le statut n'a pas d'etape : on ne sait pas ce qu'il
 *       veut dire ;</li>
 *   <li>une tache bloquee, a valider ou terminee, et tout recul.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class AlignementStatutTache {

    private final IssueRepository issueRepository;
    private final EtapeStatutService etapeStatutService;
    private final RegleAvancementParPlanning regle;
    private final ActionService actionService;

    /**
     * Transaction propre : appelee apres la validation de l'enregistrement du
     * creneau, une transaction rejointe ne serait plus validee.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void aligner(Long issueId, String auteurId) {
        Issue tache = issueRepository.findById(issueId).orElse(null);
        if (tache == null || estProjet(tache))
            return;
        Optional<EtapeAvancement> visee = regle.etapeVisee(tache.getEvents(), etapesDesSousTaches(tache));
        if (visee.isEmpty() || !peutAvancer(tache, visee.get()))
            return;
        etapeStatutService.statutDuFlux(tache, visee.get())
                .ifPresent(cible -> actionService.saveAction(changementDeStatut(tache, cible, auteurId)));
    }

    private boolean peutAvancer(Issue tache, EtapeAvancement visee) {
        if (tache.getStatus() == null)
            return true;
        EtapeAvancement actuelle = etapeStatutService.etapeDe(tache.getStatus());
        return actuelle != null && actuelle.peutAvancerAutomatiquementVers(visee);
    }

    private List<EtapeAvancement> etapesDesSousTaches(Issue tache) {
        if (CollectionUtils.isEmpty(tache.getChildren()))
            return List.of();
        List<Status> statuts = tache.getChildren().stream().map(Issue::getStatus).toList();
        Map<Long, EtapeAvancement> etapes = etapeStatutService.etapesDe(statuts);
        return statuts.stream()
                .map(status -> status == null ? null : etapes.get(status.getId()))
                .toList();
    }

    private static boolean estProjet(Issue tache) {
        return tache.getParent() == null && !CollectionUtils.isEmpty(tache.getChildren());
    }

    /** Meme forme que l'action envoyee par le front au changement de statut. */
    private static ActionItemInput changementDeStatut(Issue tache, Status cible, String auteurId) {
        ActionGroupe groupe = new ActionGroupe();
        groupe.setIssue(tache);
        if (auteurId != null) {
            UserApp auteur = new UserApp();
            auteur.setId(auteurId);
            groupe.setUser(auteur);
        }
        ActionItemInput action = new ActionItemInput();
        action.setActionType(ActionType.STATUS);
        action.setActionGroupe(groupe);
        action.setIssue(tache);
        action.setStatus(cible);
        return action;
    }
}
