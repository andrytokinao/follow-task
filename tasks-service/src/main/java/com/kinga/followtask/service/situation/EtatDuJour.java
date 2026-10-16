package com.kinga.followtask.service.situation;

import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.enumapp.ExecutionStatus;
import com.kinga.followtask.service.rappel.Couverture;
import com.kinga.followtask.service.rappel.Plage;
import com.kinga.followtask.service.rappel.PlagesPlanifiees;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Etat d'un ouvrier a un instant, et la couverture de sa journee jusque-la.
 * Calcul pur, sans base : memes regles que les rappels de planning (DT-004),
 * pour que l'ouvrier rappele a l'ordre et la direction voient le meme trou.
 *
 * @param activite   activite qui couvre l'instant ; null s'il n'y en a pas
 * @param rienDepuis debut du trou en cours (TROU_EN_COURS, NON_RENSEIGNE) ; null sinon
 * @param couverture journee jusqu'a l'instant
 */
public record EtatDuJour(EtatPersonne etat, PlanningEvent activite, LocalDateTime rienDepuis, Couverture couverture) {

    /**
     * @param evenements activites de la personne qui touchent la journee
     * @param ecoulees   plages de travail de la journee, coupees a l'instant
     * @param enHoraires vrai si l'instant tombe dans une plage de travail
     */
    public static EtatDuJour calculer(List<PlanningEvent> evenements, List<Plage> ecoulees,
                                      boolean enHoraires, LocalDateTime maintenant, Duration seuil) {
        Couverture couverture = Couverture.calculer(ecoulees, PlagesPlanifiees.de(evenements), seuil);
        PlanningEvent activite = activiteA(evenements, maintenant).orElse(null);
        if (!enHoraires) {
            return new EtatDuJour(EtatPersonne.HORS_HORAIRES, activite, null, couverture);
        }
        if (activite != null) {
            EtatPersonne etat = activite.getExecutionStatus() == ExecutionStatus.BLOCKED
                    ? EtatPersonne.BLOQUE
                    : EtatPersonne.EN_ACTIVITE;
            return new EtatDuJour(etat, activite, null, couverture);
        }
        Optional<Plage> trou = couverture.manqueA(maintenant);
        if (trou.isEmpty()) {
            return new EtatDuJour(EtatPersonne.PAUSE_COURTE, null, null, couverture);
        }
        EtatPersonne etat = couverture.vide() ? EtatPersonne.NON_RENSEIGNE : EtatPersonne.TROU_EN_COURS;
        return new EtatDuJour(etat, null, trou.get().debut(), couverture);
    }

    /** L'activite commencee le plus recemment parmi celles qui couvrent l'instant. */
    private static Optional<PlanningEvent> activiteA(List<PlanningEvent> evenements, LocalDateTime instant) {
        return evenements.stream()
                .filter(e -> PlagesPlanifiees.plageDe(e).map(p -> p.contient(instant)).orElse(false))
                .max(Comparator.comparing(PlanningEvent::getStartTime));
    }
}
