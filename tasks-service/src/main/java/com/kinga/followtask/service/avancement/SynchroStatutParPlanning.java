package com.kinga.followtask.service.avancement;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Declenche l'alignement du statut apres l'enregistrement d'un creneau
 * (DT-007).
 *
 * <p>Apres validation de l'enregistrement s'il y a une transaction, aussitot
 * sinon (fallbackExecution). Un echec est journalise et ne remonte pas :
 * le creneau est enregistre, l'utilisateur ne doit pas recevoir d'erreur pour
 * un statut qui n'a pas pu suivre.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SynchroStatutParPlanning {

    private final AlignementStatutTache alignement;

    @TransactionalEventListener(fallbackExecution = true)
    public void surPlanningEnregistre(PlanningTacheEnregistre evenement) {
        if (evenement.issueId() == null)
            return;
        try {
            alignement.aligner(evenement.issueId(), evenement.auteurId());
        } catch (RuntimeException e) {
            log.warn("Statut de la tache {} non aligne sur son planning", evenement.issueId(), e);
        }
    }
}
