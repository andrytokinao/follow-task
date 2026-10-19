package com.kinga.followtask.service.avancement;

import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.enumapp.EtapeAvancement;
import com.kinga.followtask.entity.enumapp.ExecutionStatus;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Etape qu'indique le planning d'une tache (DT-007). Aucun acces a la base :
 * la decision d'appliquer, et le choix du statut, sont ailleurs.
 *
 * <p>Le pourcentage d'un creneau est l'avancement cumule de la tache a ce
 * moment (c'est ainsi que le propose PlanningEventProgressService) : seul le
 * dernier releve compte. Le dernier releve est le creneau le plus recent, par
 * debut, qui porte un pourcentage ou un etat d'execution renseigne. Les
 * creneaux reportes sont ignores : leur copie les remplace.</p>
 *
 * <ul>
 *   <li>dernier releve BLOCKED : BLOQUE ;</li>
 *   <li>100 % et toutes les sous-taches achevees : A_VALIDER, pas TERMINE —
 *       un creneau a 100 % ne vaut pas validation ;</li>
 *   <li>plus de 0 %, ou execution commencee : EN_COURS ;</li>
 *   <li>sinon : rien.</li>
 * </ul>
 */
@Component
public class RegleAvancementParPlanning {

    private static final int ACHEVE = 100;

    /**
     * @param evenements      creneaux de la tache
     * @param etapesSousTaches etape de chaque sous-tache ; null pour une
     *                        sous-tache dont le statut n'a pas d'etape
     */
    public Optional<EtapeAvancement> etapeVisee(Collection<PlanningEvent> evenements,
                                                List<EtapeAvancement> etapesSousTaches) {
        Optional<PlanningEvent> releve = dernierReleve(evenements);
        if (releve.isEmpty())
            return Optional.empty();
        PlanningEvent dernier = releve.get();
        if (dernier.getExecutionStatus() == ExecutionStatus.BLOCKED)
            return Optional.of(EtapeAvancement.BLOQUE);
        int pourcentage = dernier.getCompletionPercentage() == null ? 0 : dernier.getCompletionPercentage();
        if (pourcentage >= ACHEVE)
            return Optional.of(sousTachesAchevees(etapesSousTaches)
                    ? EtapeAvancement.A_VALIDER
                    : EtapeAvancement.EN_COURS);
        if (pourcentage > 0 || estCommence(dernier.getExecutionStatus()))
            return Optional.of(EtapeAvancement.EN_COURS);
        return Optional.empty();
    }

    private Optional<PlanningEvent> dernierReleve(Collection<PlanningEvent> evenements) {
        if (evenements == null)
            return Optional.empty();
        return evenements.stream()
                .filter(Objects::nonNull)
                .filter(e -> e.getStartTime() != null)
                .filter(e -> e.getExecutionStatus() != ExecutionStatus.POSTPONED)
                .filter(e -> e.getCompletionPercentage() != null || estCommence(e.getExecutionStatus())
                        || e.getExecutionStatus() == ExecutionStatus.BLOCKED)
                .max(Comparator.comparing(PlanningEvent::getStartTime));
    }

    private static boolean estCommence(ExecutionStatus statut) {
        return statut == ExecutionStatus.IN_PROGRESS || statut == ExecutionStatus.COMPLETED;
    }

    private static boolean sousTachesAchevees(List<EtapeAvancement> etapes) {
        return etapes == null || etapes.stream().allMatch(etape -> etape != null && etape.estAchevee());
    }
}
