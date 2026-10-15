package com.kinga.followtask.service.phase;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Phase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Regles de la phase d'une tache : laquelle lui donner, laquelle accepter.
 *
 * <p>Une tache est classee dans l'une des phases de son type, ou dans aucune
 * si son type n'en a pas. Cette classe ne fait que decider ; l'appelant
 * enregistre.</p>
 */
@Component
@RequiredArgsConstructor
public class AffectationPhase {

    private final ResolveurPhaseCourante resolveurPhaseCourante;

    /**
     * Phase d'une nouvelle tache, dans cet ordre :
     * <ol>
     *     <li>la phase demandee, qui doit etre l'une de celles du type
     *     (exception : correction d'une phase passee, travail en avance) ;</li>
     *     <li>la phase courante du projet, si le type y est utilise ;</li>
     *     <li>la phase du type, s'il n'en a qu'une ;</li>
     *     <li>aucune.</li>
     * </ol>
     *
     * @param parent  tache parente chargee (avec son statut) ; null pour un projet
     * @param demandee phase choisie dans le formulaire ; seul son id est lu
     */
    public Phase phaseInitiale(Issue parent, IssueType type, Phase demandee) {
        List<Phase> candidates = phasesDuType(type);
        if (demandee != null && demandee.getId() != null)
            return parmi(candidates, demandee.getId())
                    .orElseThrow(() -> new RuntimeException("La phase demandee n'est pas une phase du type "
                            + type.getName() + "."));
        if (candidates.isEmpty())
            return null;
        if (parent != null) {
            Optional<Phase> courante = resolveurPhaseCourante.phaseCourante(parent)
                    .flatMap(phase -> parmi(candidates, phase.getId()));
            if (courante.isPresent())
                return courante.get();
        }
        return candidates.size() == 1 ? candidates.get(0) : null;
    }

    /**
     * Phase d'une tache qui change de type : elle garde la sienne si le nouveau
     * type l'utilise aussi, sinon elle est choisie comme pour une creation.
     */
    public Phase phaseApresChangementDeType(Issue tache, IssueType nouveauType) {
        Phase actuelle = tache.getPhase();
        if (actuelle != null) {
            Optional<Phase> gardee = parmi(phasesDuType(nouveauType), actuelle.getId());
            if (gardee.isPresent())
                return gardee.get();
        }
        return phaseInitiale(tache.getParent(), nouveauType, null);
    }

    /**
     * Phase choisie a la main pour une tache existante : l'une de celles de son
     * type, ou aucune si son type n'en a pas.
     *
     * @return la phase retenue, telle que chargee avec le type
     */
    public Phase verifierChoix(IssueType type, Long phaseId) {
        List<Phase> candidates = phasesDuType(type);
        if (phaseId == null) {
            if (!candidates.isEmpty())
                throw new RuntimeException("Le type " + type.getName()
                        + " est utilise dans des phases : choisissez l'une d'elles.");
            return null;
        }
        return parmi(candidates, phaseId)
                .orElseThrow(() -> new RuntimeException("Cette phase n'est pas une phase du type "
                        + type.getName() + "."));
    }

    private static List<Phase> phasesDuType(IssueType type) {
        return type == null || type.getPhases() == null ? List.of() : type.getPhases();
    }

    private static Optional<Phase> parmi(List<Phase> phases, Long phaseId) {
        return phases.stream().filter(phase -> Objects.equals(phase.getId(), phaseId)).findFirst();
    }
}
